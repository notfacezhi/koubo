const STORAGE_KEYS = {
  PRACTICE_LIST: 'koubo_practice_list',
  API_KEY: 'koubo_api_key',
  TIMER_DATA: 'koubo_timer_data',
};

export const storage = {
  // 获取所有练习记录
  getPracticeList() {
    const data = localStorage.getItem(STORAGE_KEYS.PRACTICE_LIST);
    return data ? JSON.parse(data) : [];
  },

  // 保存练习记录
  savePractice(item) {
    const list = this.getPracticeList();
    const existingIndex = list.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    // 最多保存20条
    const trimmedList = list.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_LIST, JSON.stringify(trimmedList));
    return item;
  },

  // 获取单条练习记录
  getPractice(id) {
    const list = this.getPracticeList();
    return list.find(i => i.id === id);
  },

  // 删除练习记录
  deletePractice(id) {
    const list = this.getPracticeList();
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_LIST, JSON.stringify(filtered));
  },

  // 清空所有记录
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.PRACTICE_LIST);
  },

  // API Key 管理
  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  setApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  },

  // 计时数据管理
  getTimerData(practiceId) {
    const data = localStorage.getItem(STORAGE_KEYS.TIMER_DATA);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed[practiceId] || null;
  },

  saveTimerData(practiceId, timerData) {
    const data = localStorage.getItem(STORAGE_KEYS.TIMER_DATA) || '{}';
    const parsed = JSON.parse(data);
    parsed[practiceId] = timerData;
    localStorage.setItem(STORAGE_KEYS.TIMER_DATA, JSON.stringify(parsed));
    return timerData;
  },
};
