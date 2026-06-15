// 天气服务：使用 Open-Meteo 免费 API（无需 API Key）
// 备用方案：wttr.in

const weatherCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 小时缓存

/**
 * 根据中文地点名称获取指定日期的天气概况
 * @param {string} location - 地点名称（支持中文）
 * @param {string} dateStr - 日期 YYYY-MM-DD
 * @returns {Promise<string>} 天气概况，如 "晴，25°C~30°C"
 */
export async function getWeather(location, dateStr) {
  const cacheKey = `${location}_${dateStr}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    // 方案1：Open-Meteo Geocoding + Forecast
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=zh`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude, name } = geoData.results[0];

        // 计算目标日期距离今天的天数
        const targetDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

        // Open-Meteo 最多支持 16 天预报
        const forecastDays = Math.max(1, Math.min(diffDays + 1, 16));

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai&forecast_days=${forecastDays}`;
        const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(5000) });

        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const daily = weatherData.daily;
          // 找到目标日期对应的数据
          const dateIdx = daily.time.findIndex(t => t === dateStr);
          if (dateIdx >= 0) {
            const code = daily.weather_code[dateIdx];
            const maxTemp = Math.round(daily.temperature_2m_max[dateIdx]);
            const minTemp = Math.round(daily.temperature_2m_min[dateIdx]);
            const weather = weatherCodeToText(code);
            const result = `${weather}，${minTemp}°C~${maxTemp}°C`;
            weatherCache.set(cacheKey, { data: result, time: Date.now() });
            return result;
          }
        }
      }
    }
  } catch {
    // Open-Meteo 失败，静默降级
  }

  // 方案2：降级到 wttr.in
  try {
    const wttrUrl = `https://wttr.in/${encodeURIComponent(location)}?format=%C+%t&lang=zh`;
    const wttrRes = await fetch(wttrUrl, { signal: AbortSignal.timeout(5000) });
    if (wttrRes.ok) {
      const text = await wttrRes.text();
      const result = text.trim() || '天气信息暂不可用';
      weatherCache.set(cacheKey, { data: result, time: Date.now() });
      return result;
    }
  } catch {
    // wttr.in 也失败
  }

  return '天气信息暂不可用';
}

/**
 * WMO Weather Code 转中文
 */
function weatherCodeToText(code) {
  if (code <= 1) return '晴';
  if (code <= 3) return '多云';
  if (code <= 4) return '阴';
  if (code <= 49) return '雾';
  if (code <= 51) return '小雨';
  if (code <= 57) return '小雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '阵雨';
  if (code <= 86) return '阵雪';
  if (code <= 99) return '雷暴';
  return '未知';
}
