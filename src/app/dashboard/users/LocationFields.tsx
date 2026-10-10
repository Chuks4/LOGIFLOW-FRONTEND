"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCities,
  getCountries,
  getStates,
  type LocationOption,
} from "@/services/axios/locations.service";
import styles from "./users.module.css";

export type ProfileLocation = {
  country?: string;
  state?: string;
  city?: string;
};

type LocationFieldsProps = {
  value: ProfileLocation;
  onChange: (location: ProfileLocation) => void;
};

export default function LocationFields({
  value,
  onChange,
}: LocationFieldsProps) {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const initialCountry = useRef(value.country);
  const initialState = useRef(value.state);

  useEffect(() => {
    let isActive = true;
    getCountries()
      .then((options) => {
        if (!isActive) return;
        setCountries(options);
        setCountryCode(
          options.find((option) => option.name === initialCountry.current)
            ?.code ?? "",
        );
      })
      .catch(() => {
        // The Axios interceptor displays the API error toast.
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!countryCode) return;

    let isActive = true;
    getStates(countryCode)
      .then((options) => {
        if (!isActive) return;
        setStates(options);
        setStateCode(
          options.find((option) => option.name === initialState.current)?.code ??
            "",
        );
        initialState.current = undefined;
      })
      .catch(() => {
        // The Axios interceptor displays the API error toast.
      });
    return () => {
      isActive = false;
    };
  }, [countryCode]);

  useEffect(() => {
    if (!countryCode || !stateCode) return;

    let isActive = true;
    getCities(countryCode, stateCode)
      .then((options) => {
        if (isActive) setCities(options);
      })
      .catch(() => {
        // The Axios interceptor displays the API error toast.
      });
    return () => {
      isActive = false;
    };
  }, [countryCode, stateCode]);

  return (
    <>
      <label className={styles.field}>
        Country
        <select
          onChange={(event) => {
            const code = event.target.value;
            const country = countries.find((option) => option.code === code);
            setCountryCode(code);
            setStateCode("");
            setStates([]);
            setCities([]);
            onChange({
              country: country?.name ?? "",
              state: "",
              city: "",
            });
            initialState.current = undefined;
          }}
          required
          value={countryCode}
        >
          <option value="">Select country</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        State
        <select
          disabled={!countryCode}
          onChange={(event) => {
            const code = event.target.value;
            const state = states.find((option) => option.code === code);
            setStateCode(code);
            setCities([]);
            onChange({ ...value, state: state?.name ?? "", city: "" });
            initialState.current = undefined;
          }}
          required
          value={stateCode}
        >
          <option value="">Select state</option>
          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        City
        <select
          disabled={!stateCode}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
          required
          value={value.city ?? ""}
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
