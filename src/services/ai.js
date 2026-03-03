import { AI_CONFIG, AI_PROMPT } from '../config/ai.config';
import { storage } from './storage';

export const aiService = {
  async analyzeText(text) {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      throw new Error('请先在设置页面配置 API Key');
    }

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: AI_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI 请求失败');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 解析 JSON 响应
    try {
      // 尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析 AI 响应');
    } catch (e) {
      throw new Error('AI 返回格式错误，请重试');
    }
  },
};
