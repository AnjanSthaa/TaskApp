import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, db } from '../../firebaseConfig'
import { NavigationProp } from '@react-navigation/native'
import { doc, setDoc } from 'firebase/firestore'

interface SignupScreenProps {
  navigation: NavigationProp<any>
}

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Step 2: Send email verification
      await sendEmailVerification(user)
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.'
      )

      // Step 3: Store signup details in Firestore with UID as the document ID
      await setDoc(doc(db, 'users', user.uid), {
        email,
        password,
      })

      // Step 4: Navigate to Login screen
      navigation.navigate('Login')
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage =
          'This email address is already in use. Please log in or use a different email.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      Alert.alert('Error', errorMessage)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>It's quick and easy.</Text>

          <TextInput
            style={styles.input}
            placeholder='Email address'
            placeholderTextColor='#8a8d91'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
          />
          <TextInput
            style={styles.input}
            placeholder='New password'
            placeholderTextColor='#8a8d91'
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.createAccountText}>
                Already have an account? Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '90%',
    maxWidth: 500,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#595757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#606770',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#dddfe2',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: '#00a400',
    borderRadius: 5,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#0866ff',
    fontSize: 14,
  },
})

export default SignupScreen
