import React, { useEffect, useRef } from "react";
import { auth } from "./firebase";
import * as firebaseui from "firebaseui";
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import "firebaseui/dist/firebaseui.css";

const FirebaseAuth = () => {
  const uiRef = useRef(null);

  useEffect(() => {
    const ui =
      firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

    const uiConfig = {
      signInSuccessUrl: "/", // Redirect URL after a successful sign-in
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          signInMethod: EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
          requireDisplayName: false,
        },
      ],
      signInFlow: "popup",
      credentialHelper: firebaseui.auth.CredentialHelper.NONE,
      callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          console.log("Sign in successful with result: ", authResult);
          return false; // Returning false prevents the redirect
        },
        uiShown: () => {
          console.log("FirebaseUI shown");
        },
      },
    };

    ui.start(uiRef.current, uiConfig);

    return () => ui.reset(); // Cleanup UI on component unmount
  }, []);

  return <div ref={uiRef} id="firebaseui-auth-container"></div>;
};

export default FirebaseAuth;
