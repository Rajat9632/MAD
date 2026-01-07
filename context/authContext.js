import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../FirebaseConfig.js";
import { doc, setDoc, updateDoc ,getDoc} from "firebase/firestore";


export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);
    const [isNewUser,setIsNewUser]=useState(false);


    useEffect(() => {
        //on authstateChanged
        const unsub = onAuthStateChanged(auth,async (user) => {
            if (user) {
                setUser(user);
                setIsAuthenticated(true);

                const userDoc = await getDoc(doc(db, "USERS", user.uid));
                if (userDoc.exists()) {
                    setIsNewUser(!userDoc.data().Role);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);    
                setIsNewUser(false);
            }
        });
        return unsub;
    }, [])

    const register = async (email, password, username) => {
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            
            const userDoc = {
                UserName: username,
                Email: email,
                UUID: response.user.uid,
                Role: null,
                createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "USERS", response.user.uid), userDoc);
            setIsNewUser(true);
            setUser(response.user);

            return { success: true, data: response?.user };
        } catch (e) {
            let msg = e.message;
            if (msg.includes('(auth/invalid-email)')) msg = 'Invalid Email';
            if (msg.includes('(auth/email-already-in-use)')) msg = 'Email Already In Use';
            return { success: false, msg };

        }
    }
    const login = async (email, password) => {
        try {
            const response = await signInWithEmailAndPassword(auth, email, password);
            setIsNewUser(false);
            return { success: true }
        } catch (e) {
            let msg = e.message;
            if (msg.includes('(auth/invalid-email)')) msg = 'Invalid Email';
            if (msg.includes('(auth/invalid-credential)')) msg = 'Wrong Email/Password';
            return { success: false, msg };
        }
    }
    const logout = async () =>{
        try {
            await signOut(auth);
            return{success:true}
        } catch (e) {
            return{success:false , msg:e.message}
        }
    }
    const UpdateUserData = async (data) =>{
        try {
            const docRef = doc(db, "USERS", user?.uid);
            await updateDoc(docRef, data);
            
            // Update isNewUser state after role is set
            if (data.Role) {
                setIsNewUser(false);
            }
            return { success: true };
        } catch (error) {
            console.error('Update error:', error);
            return { success: false, error };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, register, login,isNewUser,logout,UpdateUserData,setIsNewUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const value = useContext(AuthContext);

    if (!value) {
        throw new Error("useAuth must be wrapped inside AuthContextProvider");
    } return value;
}