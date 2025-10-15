// src/services/authService.js
import auth from '@react-native-firebase/auth';

export const signIn = (email, password) =>
  auth().signInWithEmailAndPassword(email, password);

export const signUp = (email, password) =>
  auth().createUserWithEmailAndPassword(email, password);

export const signOut = () => auth().signOut();

export const onAuthChanged = (cb) => auth().onAuthStateChanged(cb);

export const currentUser = () => auth().currentUser;
