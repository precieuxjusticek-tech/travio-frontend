import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAX8GbMuul0PsvIMGK1z_oPOdIk28Tzg3E",
  authDomain:        "travio-klippo.firebaseapp.com",
  projectId:         "travio-klippo",
  storageBucket:     "travio-klippo.firebasestorage.app",
  messagingSenderId: "441183554149",
  appId:             "1:441183554149:web:cea0434373677a685e948c"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };