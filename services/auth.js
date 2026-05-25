import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

//Registers a new user and creates a profile record in Firestore
export const registerUser = async (email, password, firstName, lastName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user info in Firestore under /users/{uid}
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      createdAt: Date.now(),
    });

    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Updates user profile information
export const updateUserProfile = async (userId, data) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    throw error;
  }
};

//Logs in an existing user
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

//Logs out the current user
export const logoutUser = () => {
  return signOut(auth);
};
