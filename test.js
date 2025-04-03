import { db } from './firebaseConfig.js'
import { doc, getDoc } from 'firebase/firestore'

// Function to fetch the document
const fetchDocument = async () => {
  const docRef = doc(db, 'test', '0EXBzyY6TJwlDZ8EPc14')
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    console.log('No such document!')
    return null
  }
}

// Test function
const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...')
    const result = await fetchDocument()
    if (result) {
      console.log('Successfully fetched document:', result)
    } else {
      console.log('Document not found or empty')
    }
  } catch (error) {
    console.error('Error fetching document:', error)
  }
}

// Run the test
testFirebaseConnection()
