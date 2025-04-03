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
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebaseConfig' // Update the path to your firebaseConfig.js
import { db } from '../../firebaseConfig' // Import Firestore instance
import { doc, getDoc, setDoc } from 'firebase/firestore' // Import Firestore functions
import { NavigationProp } from '@react-navigation/native'

interface LoginScreenProps {
  navigation: NavigationProp<any>
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert('Error', 'Please verify your email before logging in.')
        return
      }

      // Check if user data already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        // If user data doesn't exist, store it in Firestore
        await setDoc(userDocRef, {
          email,
          password,
        })
      }

      Alert.alert('Success', 'Logged in successfully!')
      navigation.navigate('Index') // Navigate to the main task screen
    } catch (error) {
      let errorMessage = 'Failed to log in. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      Alert.alert('Error', errorMessage)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.form}>
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
            placeholder='Password'
            placeholderTextColor='#8a8d91'
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text style={styles.forgotPassword}>Forgotten password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.createAccountText}>Create new account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pageLinkContainer}>
        <Text style={styles.pageText}>
          You won't forget what you need to do again!
        </Text>
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
  loginButton: {
    backgroundColor: '#0866ff',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  forgotPassword: {
    color: '#0866ff',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#dadde1',
    width: '100%',
    marginVertical: 20,
  },
  createAccountButton: {
    backgroundColor: '#42b72a',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  createAccountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageLinkContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    color: '#1c1e21',
  },
})

export default LoginScreen
