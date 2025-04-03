import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native'
import { linkWithCredential, updatePassword } from 'firebase/auth'
import { db } from '../../firebaseConfig'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, PhoneAuthProvider } from 'firebase/auth'
import { NavigationProp } from '@react-navigation/native'
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'
import { MaterialIcons } from '@expo/vector-icons'

// Define the type for the navigation prop
interface ProfileScreenProps {
  navigation: NavigationProp<any>
}

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const [firestoreData, setFirestoreData] = useState<{
    email?: string
    password?: string
  } | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] =
    useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null)

  const user = getAuth().currentUser

  // Redirect to Login if user is not logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        navigation.navigate('Login')
      }
    })
    return unsubscribe // Cleanup function
  }, [navigation])

  // Fetch Firestore data and check verification status
  useEffect(() => {
    const fetchFirestoreData = async () => {
      if (!user) return // Ensure user is logged in

      try {
        const docRef = doc(db, 'users', user.uid) // Use user.uid to fetch data
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setFirestoreData(docSnap.data()) // Set Firestore data in state
        } else {
          console.log('No Firestore document exists for this user!')
        }

        // Check if email is verified
        setIsEmailVerified(user.emailVerified)

        // Check if phone number is verified
        if (docSnap.exists() && docSnap.data().phoneNumberVerified) {
          setIsPhoneVerified(true)
        }
      } catch (error) {
        console.error('Error fetching Firestore data:', error)
      } finally {
        setIsLoading(false) // Set loading to false after fetching data
      }
    }

    fetchFirestoreData()
  }, [user]) // Re-fetch when user changes

  // Handle phone number verification
  const handleSendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number')
      return
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/ // E.164 format
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert(
        'Error',
        'Please enter a valid phone number in international format (e.g., +1234567890)'
      )
      return
    }

    try {
      const auth = getAuth()
      const phoneProvider = new PhoneAuthProvider(auth)
      console.log('Sending OTP...') // Debug log
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current!
      )
      setVerificationId(verificationId)
      Alert.alert('Success', 'OTP sent to your phone number')
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      let errorMessage = 'Failed to send OTP. Please try again.'
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage =
          'Invalid phone number format. Please use the international format (e.g., +1234567890).'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.'
      }
      Alert.alert('Error', errorMessage)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || !verificationId) {
      Alert.alert('Error', 'Please enter the OTP')
      return
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp)

      if (user) {
        // Use the imported linkWithCredential function
        await linkWithCredential(user, credential)
        Alert.alert('Success', 'Phone number linked successfully!')

        // Update Firestore to reflect phone number verification
        const userDocRef = doc(db, 'users', user.uid)
        await setDoc(userDocRef, { phoneNumberVerified: true }, { merge: true })

        // Update local state
        setIsPhoneVerified(true)
      } else {
        Alert.alert('Error', 'No user is currently logged in.')
      }
    } catch (error: any) {
      console.error('Error linking phone number:', error)

      let errorMessage = 'Failed to verify OTP. Please try again.'
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please enter the correct code.'
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = 'This phone number is already linked to another account.'
      }
      Alert.alert('Error', errorMessage)
    }
  }

  // Handle password reset
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    try {
      if (user) {
        // Update password in Firebase Authentication
        await updatePassword(user, newPassword)

        // Update password in Firestore (if stored)
        const userDocRef = doc(db, 'users', user.uid)
        await setDoc(userDocRef, { password: newPassword }, { merge: true })

        // Update local state to reflect the new password
        setFirestoreData((prevData) => ({
          ...prevData,
          password: newPassword,
        }))

        Alert.alert('Success', 'Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordError('')
        setIsResetPasswordModalVisible(false)
      } else {
        Alert.alert('Error', 'No user is currently logged in.')
      }
    } catch (error: any) {
      console.error('Error updating password:', error)
      let errorMessage = 'Failed to update password. Please try again.'
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please re-authenticate to update your password.'
      }
      Alert.alert('Error', errorMessage)
    }
  }

  const openModal = () => {
    setTimeout(() => setIsResetPasswordModalVisible(true), 50)
  }

  console.log(user?.providerData) // This will show all linked providers (email, phone, etc.)

  // Show a loading indicator while data is being fetched
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={getAuth().app.options}
      />

      <Text style={styles.header}>Profile</Text>

      {/* Display Firestore Data */}
      {firestoreData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>
            Email: {firestoreData.email ?? 'N/A'}
          </Text>
          <View style={styles.passwordContainer}>
            <Text style={styles.dataText}>
              Password: {firestoreData.password ?? 'N/A'}
            </Text>
            <TouchableOpacity style={styles.editIcon} onPress={openModal}>
              <MaterialIcons name='edit' size={20} color='#4CAF50' />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Display Verification Status */}
      <View style={styles.verificationStatusContainer}>
        <Text style={styles.verificationStatusText}>
          Email Verification:{' '}
          {isEmailVerified ? 'Verified ✅' : 'Not Verified ❌'}
        </Text>
        <Text style={styles.verificationStatusText}>
          Phone Verification:{' '}
          {isPhoneVerified ? 'Verified ✅' : 'Not Verified ❌'}
        </Text>
      </View>

      {/* Show "Click here to verify phone number" if phone is not verified */}
      {!isPhoneVerified && (
        <TouchableOpacity
          onPress={() => setShowPhoneVerification(true)}
          style={styles.verifyPhoneTextContainer}
        >
          <Text style={styles.verifyPhoneText}>
            Click here to verify phone number
          </Text>
        </TouchableOpacity>
      )}

      {/* Conditionally render OTP form if phone is not verified and showPhoneVerification is true */}
      {!isPhoneVerified && showPhoneVerification && (
        <View style={styles.verificationContainer}>
          <TextInput
            style={styles.input}
            placeholder='Enter Phone Number (e.g., +1234567890)'
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType='phone-pad'
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder='Enter OTP'
            value={otp}
            onChangeText={setOtp}
            keyboardType='number-pad'
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalVisible && (
        <Modal
          transparent={true}
          animationType='fade'
          onRequestClose={() => setIsResetPasswordModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>Reset Password</Text>
              <TextInput
                style={styles.input}
                placeholder='New Password'
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {passwordError && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>Reset Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsResetPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dataContainer: {
    marginBottom: 20,
  },
  dataText: {
    fontSize: 16,
    marginBottom: 0,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 8,
  },
  verificationStatusContainer: {
    marginBottom: 20,
  },
  verificationStatusText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  verificationContainer: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyPhoneTextContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  verifyPhoneText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
})

export default ProfileScreen
