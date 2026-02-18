"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

type PublicAuthValue = {
  authEnabled: boolean;
  isSignedIn: boolean;
};

const PublicAuthContext = createContext<PublicAuthValue>({
  authEnabled: false,
  isSignedIn: false,
});

function ClerkPublicAuthProvider(props: {
  initialSignedIn?: boolean;
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const value = useMemo<PublicAuthValue>(
    () => ({
      authEnabled: true,
      isSignedIn: isLoaded ? Boolean(isSignedIn) : Boolean(props.initialSignedIn),
    }),
    [isLoaded, isSignedIn, props.initialSignedIn],
  );
  return <PublicAuthContext.Provider value={value}>{props.children}</PublicAuthContext.Provider>;
}

export function PublicAuthProvider(props: {
  authEnabled: boolean;
  initialSignedIn?: boolean;
  children: React.ReactNode;
}) {
  if (!props.authEnabled) {
    return (
      <PublicAuthContext.Provider value={{ authEnabled: false, isSignedIn: false }}>
        {props.children}
      </PublicAuthContext.Provider>
    );
  }

  return <ClerkPublicAuthProvider initialSignedIn={props.initialSignedIn}>{props.children}</ClerkPublicAuthProvider>;
}

export function usePublicAuth(): PublicAuthValue {
  return useContext(PublicAuthContext);
}
