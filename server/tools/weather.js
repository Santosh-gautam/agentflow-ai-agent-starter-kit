export const weatherTool = {
  declaration: {
    name: 'getLiveWeather',
    description: 'Fetch real-time weather information and forecast for any city or location in the world.',
    parameters: {
      type: 'OBJECT',
      properties: {
        city: {
          type: 'STRING',
          description: 'The name of the city (e.g., Mumbai, New York, London, Tokyo, Delhi)',
        },
      },
      required: ['city'],
    },
  },
  async execute(args) {
    const city = args.city || 'Delhi';
    try {
      // Using free Open-Meteo geocoding & forecast API (No API key required)
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        return {
          city,
          error: `Could not find coordinates for "${city}".`,
          temp: 24,
          condition: 'Partly Cloudy (Simulated)',
          humidity: 60,
        };
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`);
      const weatherData = await weatherRes.json();

      const current = weatherData.current || {};
      const weatherCodeMap = {
        0: 'Clear sky ☀️',
        1: 'Mainly clear 🌤️',
        2: 'Partly cloudy ⛅',
        3: 'Overcast ☁️',
        45: 'Foggy 🌫️',
        51: 'Light drizzle 🌦️',
        61: 'Slight rain 🌧️',
        63: 'Moderate rain 🌧️',
        71: 'Slight snow 🌨️',
        95: 'Thunderstorm ⛈️',
      };

      return {
        city: `${name}, ${country}`,
        temperatureCelsius: current.temperature_2m,
        apparentTemperature: current.apparent_temperature,
        humidityPercent: current.relative_humidity_2m,
        windSpeedKmH: current.wind_speed_10m,
        condition: weatherCodeMap[current.weather_code] || 'Clear/Cloudy ⛅',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        city,
        error: err.message,
        simulated: true,
        temperatureCelsius: 28,
        condition: 'Sunny ☀️',
      };
    }
  },
};
