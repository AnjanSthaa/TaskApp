import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { getDatabase, ref, get, set } from 'firebase/database'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { NavigationProp } from '@react-navigation/native'

// Define the structure of user data
interface UserData {
  name: string
  age: number
}

interface IndexProps {
  navigation: NavigationProp<any>
}

function Index({ navigation }: IndexProps) {
  // Accept navigation prop
  const [newTask, setNewTask] = useState('')
  const [tasks, setTasks] = useState<
    { key: string; name: string; details: string }[]
  >([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<number | null>(null)
  const [showTaskInput, setShowTaskInput] = useState<boolean>(false)
  const [taskDetails, setTaskDetails] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null)

  const user = getAuth().currentUser

  // Redirect to Login if user is not logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        navigation.navigate('Login')
      }
    })
    return unsubscribe
  }, [navigation])

  // Function to handle edit icon click
  const handleEditClick = (task: {
    key: string
    name: string
    details: string
  }) => {
    setIsEditMode(true)
    setEditingTaskKey(task.key)
    setNewTask(task.name)
    setTaskDetails(task.details)
    setShowTaskInput(true) // Show the input boxes
  }

  // Function to handle task submission (both create and edit)
  const handleTaskSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a task')
      return
    }

    if (newTask.trim() === '') {
      setErrorMessage('Task name cannot be empty')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    try {
      const database = getDatabase()
      if (isEditMode && editingTaskKey) {
        // Update existing task
        const taskRef = ref(
          database,
          `Users/${user.uid}/Tasks/${editingTaskKey}`
        )
        await set(taskRef, { name: newTask, details: taskDetails })
        setIsEditMode(false) // Reset edit mode
        setEditingTaskKey(null) // Clear editing task key
      } else {
        // Create new task
        const taskKey = Date.now()
        const taskRef = ref(database, `Users/${user.uid}/Tasks/${taskKey}`)
        await set(taskRef, { name: newTask, details: taskDetails })
      }
      setNewTask('')
      setTaskDetails('')
      setShowTaskInput(false)
      setErrorMessage(null)
      fetchTasks()
    } catch (error) {
      console.error('Error adding/updating task in Realtime Database:', error)
    }
  }

  // Function to fetch tasks from Realtime Database
  const fetchTasks = async () => {
    if (!user) return

    try {
      const database = getDatabase()
      const dbRef = ref(database, `Users/${user.uid}/Tasks`)
      const snapshot = await get(dbRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const tasksArray = Object.entries(data).map(([key, value]) => ({
          key,
          ...(value as { name: string; details: string }),
        }))
        setTasks(tasksArray)
      } else {
        console.log('No tasks available!')
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks from Realtime Database:', error)
    }
  }

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [user])

  // Function to handle task selection
  const handleTaskPress = (index: number) => {
    setSelectedTask(selectedTask === index ? null : index) // Toggle selection
  }

  // Function to handle delete icon click
  const handleDeleteClick = (task: {
    key: string
    name: string
    details: string
  }) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you have done the task? -_-',
      [
        {
          text: 'No',
          style: 'cancel', // Cancel action
        },
        {
          text: 'Yes',
          onPress: () => deleteTask(task.key), // Delete task on confirmation
        },
      ],
      { cancelable: true } // Allow dismissing the alert by tapping outside
    )
  }

  // Function to delete a task from the database
  const deleteTask = async (taskKey: string) => {
    if (!user) {
      console.error('User is not authenticated')
      return
    }

    try {
      const database = getDatabase()
      const taskRef = ref(database, `Users/${user.uid}/Tasks/${taskKey}`)
      await set(taskRef, null) // Delete the task by setting it to null
      fetchTasks() // Fetch updated tasks
    } catch (error) {
      console.error('Error deleting task from Realtime Database:', error)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* New Task Button */}
        <View style={styles.newTaskButtonContainer}>
          <MaterialIcons
            name='add'
            size={24}
            color='#fff'
            style={styles.newTaskButton}
            onPress={() => {
              setIsEditMode(false) // Ensure we are in create mode
              setShowTaskInput(!showTaskInput) // Toggle input visibility
            }}
          />
        </View>

        {/* Task Input and Details Input */}
        {showTaskInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={isEditMode ? 'Edit Name' : 'Enter task name'}
              value={newTask}
              onChangeText={setNewTask}
              autoFocus={true}
            />
            <TextInput
              style={styles.detailsInput}
              placeholder={isEditMode ? 'Edit Details' : 'Enter details'}
              value={taskDetails}
              onChangeText={setTaskDetails}
            />
            <MaterialIcons
              name='check'
              size={24}
              color='#4CAF50'
              style={styles.submitButton}
              onPress={handleTaskSubmit} // Submit task (create or edit)
            />
          </View>
        )}

        {/* Display error message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* New section to display tasks using FlatList */}
        <View style={styles.taskSection}>
          <Text style={styles.header}>Tasks:</Text>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.key} // Use the task key as the unique identifier
            renderItem={({ item, index }) => (
              <View>
                <View
                  style={[
                    styles.taskItem,
                    selectedTask === index && styles.selectedTaskItem,
                  ]}
                >
                  <Text
                    style={styles.taskText}
                    onPress={() => handleTaskPress(index)}
                  >
                    {`${index + 1}. ${item.name}`}
                  </Text>
                  {/* Render icons only when selected */}
                  {selectedTask === index && (
                    <View style={styles.iconContainer}>
                      <MaterialIcons
                        name='edit'
                        size={20}
                        color='#000'
                        style={styles.icon}
                        onPress={() => handleEditClick(item)} // Handle edit click
                      />
                      <MaterialIcons
                        name='delete'
                        size={20}
                        color='#000'
                        style={styles.icon}
                        onPress={() => handleDeleteClick(item)} // Handle delete click
                      />
                    </View>
                  )}
                </View>
                {/* Display details when task is selected */}
                {selectedTask === index && item.details && (
                  <Text style={styles.taskDetails}>{item.details}</Text>
                )}
              </View>
            )}
            ListEmptyComponent={<Text>No tasks available</Text>}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  newTaskButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  newTaskButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    padding: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  errorContainer: {
    justifyContent: 'center',
    marginTop: 5, // Add small margin between input and error message
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'left',
  },
  taskSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedTaskItem: {
    backgroundColor: '#f0f0f0', // Highlight selected item
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
  taskDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    paddingHorizontal: 10,
  },
  submitButton: {
    alignSelf: 'flex-end',
  },
  detailsInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60, // Fixed width for icon container
  },
  icon: {
    marginLeft: 10, // Space between icons
  },
})
