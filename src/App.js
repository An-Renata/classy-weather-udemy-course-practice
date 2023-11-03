import { useState, useEffect } from "react";
import { convertToFlag, getWeatherIcon, formatDay } from "./helpers";

export default function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});
  // Set user input value into location state
  function handleLocationInput(e) {
    setLocation(e.target.value);
  }

  // get the input value from local storage if there is any on initial render
  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
  }, []); // dependency as empty array: only renders on initial render

  useEffect(() => {
    async function fetWeather() {
      // Do not update weather state if the user inputs less than 2 chars
      if (location.length < 2) return setWeather({});

      try {
        setIsLoading(true);
        // 1) Getting location from the input (geocoding) Lat/lang
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Location not found");
        // using destructuring to get the data needed
        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);

        // Update displayLocation state by storing the name of location including country_code
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather data
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        // update state by storing the return value to weather state
        setWeather(weatherData.daily);
        //!............................
        // set user input location to the local storage
        localStorage.setItem("location", location);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetWeather();
  }, [location]); // useEffect is called each time location variable changes.
  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <div>
        <Input location={location} onChangeLocation={handleLocationInput} />
      </div>

      {isLoading && <p className="loader">Loading...</p>}

      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

function Input({ location, onChangeLocation }) {
  return (
    <input
      type="text"
      placeholder="Search for location..."
      value={location}
      onChange={onChangeLocation}
    />
  );
}

function Weather({ weather, location }) {
  // destructuring and renaming returned data to make it easier to understand and use
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            isToday={i === 0}
            key={date}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
