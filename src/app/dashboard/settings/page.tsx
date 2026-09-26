"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";
import PasswordField from "@/components/PasswordField";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  updateCurrentUser,
  type UserProfile,
} from "@/services/axios/users.service";
import styles from "./settings.module.css";
import {
  getCities,
  getCountries,
  getStates,
  type LocationOption,
} from "@/services/axios/locations.service";

const emptyProfile: UserProfile = {
  id: "",
  email: "",
  firstName: "",
  lastName: "",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void Promise.all([getCurrentUser(), getCountries()])
        .then(([user, countryOptions]) => {
          setProfile(user);
          setCountries(countryOptions);
          const country = countryOptions.find(
            (option) => option.name === user.country,
          );
          if (country?.code) setCountryCode(country.code);
        })
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!countryCode) {
      const timeoutId = window.setTimeout(() => {
        setStates([]);
        setCities([]);
        setStateCode("");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void getStates(countryCode)
        .then((options) => {
          setStates(options);
          const selectedState = options.find(
            (option) => option.name === profile.state,
          );
          setStateCode(selectedState?.code ?? "");
        })
        .catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [countryCode, profile.state]);

  useEffect(() => {
    if (!countryCode || !stateCode) {
      const timeoutId = window.setTimeout(() => setCities([]), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void getCities(countryCode, stateCode)
        .then(setCities)
        .catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [countryCode, stateCode]);

  async function saveProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const selectedCountry = countries.find(
      (option) => option.code === countryCode,
    );
    const selectedState = states.find((option) => option.code === stateCode);
    const profileData = {
      ...data,
      country: selectedCountry?.name ?? "",
      state: selectedState?.name ?? "",
    };
    try {
      setProfile(
        await updateCurrentUser(profileData as Record<string, string>),
      );
      toast.success("Profile updated successfully.");
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPassword(true);
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("newPassword"));
    const confirmPassword = String(data.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      setIsSavingPassword(false);
      return;
    }

    try {
      await changeCurrentUserPassword({
        oldPassword: String(data.get("oldPassword")),
        newPassword,
      });
      event.currentTarget.reset();
      toast.success("Password changed successfully.");
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.kicker}>Account</p>
        <h2>Settings</h2>
        <p>Update your profile details and keep your account secure.</p>
      </div>
      <div className={styles.grid}>
        <form className={styles.card} onSubmit={saveProfile}>
          <h3>Profile information</h3>
          {isLoading ? (
            <p className={styles.muted}>Loading profile...</p>
          ) : (
            <div className={styles.fields}>
              <label>
                First name
                <input
                  defaultValue={profile.firstName}
                  name="firstName"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  defaultValue={profile.lastName}
                  name="lastName"
                  required
                />
              </label>
              <label>
                Email
                <input defaultValue={profile.email} disabled type="email" />
              </label>
              <label>
                Phone number
                <input
                  defaultValue={profile.phoneNumber ?? ""}
                  name="phoneNumber"
                />
              </label>
              <label>
                Country
                <select
                  name="country"
                  onChange={(event) => {
                    const option = countries.find(
                      (item) => item.code === event.target.value,
                    );
                    setCountryCode(event.target.value);
                    setStateCode("");
                    setStates([]);
                    setCities([]);
                    setProfile((current) => ({
                      ...current,
                      country: option?.name ?? "",
                      state: "",
                      city: "",
                    }));
                  }}
                  value={countryCode}
                  required
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                State
                <select
                  disabled={!countryCode}
                  name="state"
                  onChange={(event) => {
                    const option = states.find(
                      (item) => item.code === event.target.value,
                    );
                    setStateCode(event.target.value);
                    setCities([]);
                    setProfile((current) => ({
                      ...current,
                      state: option?.name ?? "",
                      city: "",
                    }));
                  }}
                  value={stateCode}
                  required
                >
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                City
                <select
                  disabled={!stateCode}
                  name="city"
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  value={profile.city ?? ""}
                  required
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.full}>
                Address
                <input defaultValue={profile.address ?? ""} name="address" />
              </label>
            </div>
          )}
          <button
            className={styles.primary}
            disabled={isSavingProfile || isLoading}
            type="submit"
          >
            {isSavingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
        <form className={styles.card} onSubmit={savePassword}>
          <h3>Change password</h3>
          <div className={styles.passwordFields}>
            <PasswordField
              autoComplete="current-password"
              id="oldPassword"
              label="Current password"
              name="oldPassword"
              placeholder="Enter current password"
              required
            />
            <PasswordField
              autoComplete="new-password"
              id="newPassword"
              label="New password"
              minLength={8}
              name="newPassword"
              placeholder="Enter new password"
              required
            />
            <PasswordField
              autoComplete="new-password"
              id="confirmPassword"
              label="Confirm new password"
              minLength={8}
              name="confirmPassword"
              placeholder="Confirm new password"
              required
            />
          </div>
          <button
            className={styles.primary}
            disabled={isSavingPassword}
            type="submit"
          >
            {isSavingPassword ? "Updating..." : "Change password"}
          </button>
        </form>
      </div>
    </section>
  );
}
