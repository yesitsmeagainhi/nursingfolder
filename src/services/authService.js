import auth from "@react-native-firebase/auth";

// Convert mobile → fake email
const formatEmail = (mobile) => `${mobile}@nursing.com`;

export const registerUser = async (mobile, password) => {
  return auth().createUserWithEmailAndPassword(formatEmail(mobile), password);
};

export const loginUser = async (mobile, password) => {
  return auth().signInWithEmailAndPassword(formatEmail(mobile), password);
};

export const logoutUser = async () => {
  return auth().signOut();
};
