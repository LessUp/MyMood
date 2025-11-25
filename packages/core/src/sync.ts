/**
 * 同步管理器 - 处理云端数据同步
 */

import type { 
  MoodRecordMap, 
  SyncResult, 
  HttpAdapter,
  AuthToken 
} from '@moodflow/types';
import { StorageManager } from './storage';

export interface SyncConfig {
  apiBaseUrl: string;
  getAuthToken: () => Promise<AuthToken | null>;
}

/**
 * 同步管理器
 */
export class SyncManager {
  private storageManager: StorageManager;
  private httpAdapter: HttpAdapter;
  private config: SyncConfig;
  private syncing = false;

  constructor(
    storageManager: StorageManager,
    httpAdapter: HttpAdapter,
    config: SyncConfig
  ) {
    this.storageManager = storageManager;
    this.httpAdapter = httpAdapter;
    this.config = config;
  }

  /**
   * 是否正在同步
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * 执行完整同步
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncing) {
      throw new Error('SYNC_IN_PROGRESS');
    }

    const token = await this.config.getAuthToken();
    if (!token) {
      throw new Error('NOT_AUTHENTICATED');
    }

    this.syncing = true;
    
    try {
      // 获取远程数据
      const remote = await this.fetchRemoteData(token);
      const local = await this.storageManager.getAllEntries();
      
      // 计算差异并合并
      const result = await this.mergeData(local, remote, token);
      
      return {
        ...result,
        syncedAt: Date.now()
      };
    } finally {
      this.syncing = false;
    }
  }

  /**
   * 获取远程数据
   */
  private async fetchRemoteData(token: AuthToken): Promise<MoodRecordMap> {
    const response = await this.httpAdapter.get<{ data: MoodRecordMap }>(
      `${this.config.apiBaseUrl}/sync/records`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      }
    );
    return response.data || {};
  }

  /**
   * 上传本地数据
   */
  private async uploadLocalData(
    entries: MoodRecordMap,
    token: AuthToken
  ): Promise<void> {
    await this.httpAdapter.post(
      `${this.config.apiBaseUrl}/sync/records`,
      { records: entries },
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      }
    );
  }

  /**
   * 合并本地和远程数据
   */
  private async mergeData(
    local: MoodRecordMap,
    remote: MoodRecordMap,
    token: AuthToken
  ): Promise<Omit<SyncResult, 'syncedAt'>> {
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    let updatedLocal = 0;
    let updatedRemote = 0;
    let conflicts = 0;
    
    const toUpload: MoodRecordMap = {};
    const toMerge: MoodRecordMap = {};
    
    for (const key of allKeys) {
      const l = local[key];
      const r = remote[key];
      const lts = l?.ts || 0;
      const rts = r?.ts || 0;
      
      if (!l && r) {
        // 仅远程有，合并到本地
        toMerge[key] = r;
        updatedLocal++;
      } else if (l && !r) {
        // 仅本地有，上传到远程
        if (l.mood || l.note) {
          toUpload[key] = l;
          updatedRemote++;
        }
      } else if (l && r) {
        if (lts > rts) {
          // 本地更新，上传
          toUpload[key] = l;
          updatedRemote++;
        } else if (rts > lts) {
          // 远程更新，合并
          toMerge[key] = r;
          updatedLocal++;
        } else if (lts === rts && (l.mood !== r.mood || l.note !== r.note)) {
          // 时间戳相同但内容不同，算冲突，保留本地
          conflicts++;
        }
      }
    }
    
    // 合并远程数据到本地
    if (Object.keys(toMerge).length > 0) {
      await this.storageManager.mergeEntries(toMerge);
    }
    
    // 上传本地数据到远程
    if (Object.keys(toUpload).length > 0) {
      await this.uploadLocalData(toUpload, token);
    }
    
    return { updatedLocal, updatedRemote, conflicts };
  }

  /**
   * 强制上传所有本地数据（覆盖远程）
   */
  async forceUpload(): Promise<{ uploaded: number }> {
    const token = await this.config.getAuthToken();
    if (!token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    
    const local = await this.storageManager.getAllEntries();
    await this.uploadLocalData(local, token);
    
    return { uploaded: Object.keys(local).length };
  }

  /**
   * 强制下载远程数据（覆盖本地）
   */
  async forceDownload(): Promise<{ downloaded: number }> {
    const token = await this.config.getAuthToken();
    if (!token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    
    const remote = await this.fetchRemoteData(token);
    await this.storageManager.importEntries(remote, true);
    
    return { downloaded: Object.keys(remote).length };
  }
}

/**
 * 创建同步管理器
 */
export function createSyncManager(
  storageManager: StorageManager,
  httpAdapter: HttpAdapter,
  config: SyncConfig
): SyncManager {
  return new SyncManager(storageManager, httpAdapter, config);
}
