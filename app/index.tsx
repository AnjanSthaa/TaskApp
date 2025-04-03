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
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { getDatabase, ref, get, set } from 'firebase/database'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { NavigationProp } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'

// Define the task categories
const CATEGORIES = [
  'Personal',
  'Work',
  'Shopping',
  'Health',
  'Education',
  'Other',
]

// Define the task priorities
const PRIORITIES = [
  { label: 'Low', color: '#8BC34A' },
  { label: 'Medium', color: '#FFC107' },
  { label: 'High', color: '#F44336' },
]

// Define sort options
const SORT_OPTIONS = {
  NONE: 'none',
  PRIORITY_ASC: 'priority_asc',
  PRIORITY_DESC: 'priority_desc',
}

// Define the structure of a task
interface Task {
  key: string
  name: string
  details: string
  category: string
  priority: number
  dueDate: string | null
  isCompleted: boolean
}

interface IndexProps {
  navigation: NavigationProp<any>
}

function Index({ navigation }: IndexProps) {
  // Accept navigation prop
  const [newTask, setNewTask] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<number | null>(null)
  const [showTaskInput, setShowTaskInput] = useState<boolean>(false)
  const [taskDetails, setTaskDetails] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0]
  )
  const [selectedPriority, setSelectedPriority] = useState<number>(0)
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false)
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.NONE)
  const [showSortModal, setShowSortModal] = useState<boolean>(false)
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  // Reset form values
  const resetForm = () => {
    setNewTask('')
    setTaskDetails('')
    setSelectedCategory(CATEGORIES[0])
    setSelectedPriority(0)
    setDueDate(null)
    setIsEditMode(false)
    setEditingTaskKey(null)
  }

  // Function to handle edit icon click
  const handleEditClick = (task: Task) => {
    setIsEditMode(true)
    setEditingTaskKey(task.key)
    setNewTask(task.name)
    setTaskDetails(task.details)
    setSelectedCategory(task.category)
    setSelectedPriority(task.priority)
    setDueDate(task.dueDate)
    setShowTaskInput(true)
  }

  // Function to show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }

  // Function to handle task submission
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
      const taskData = {
        name: newTask,
        details: taskDetails,
        category: selectedCategory,
        priority: selectedPriority,
        dueDate: dueDate,
        isCompleted: false,
      }

      if (isEditMode && editingTaskKey) {
        const taskRef = ref(
          database,
          `Users/${user.uid}/Tasks/${editingTaskKey}`
        )
        await set(taskRef, taskData)
        showSuccess('Task updated successfully!')
      } else {
        const taskKey = Date.now()
        const taskRef = ref(database, `Users/${user.uid}/Tasks/${taskKey}`)
        await set(taskRef, taskData)
        showSuccess('Task added successfully!')
      }

      resetForm()
      setShowTaskInput(false)
      setErrorMessage(null)
      fetchTasks()
    } catch (error) {
      console.error('Error adding/updating task:', error)
      Alert.alert('Error', 'Failed to save task. Please try again.')
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
          ...(value as Omit<Task, 'key'>),
          // Ensure all tasks have category and priority with defaults if missing
          category: (value as any).category || CATEGORIES[0],
          priority:
            typeof (value as any).priority === 'number'
              ? (value as any).priority
              : 0,
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
  const handleDeleteClick = (task: Task) => {
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

  // Function to sort tasks by priority
  const sortTasks = (tasksToSort: Task[]) => {
    if (sortOption === SORT_OPTIONS.NONE) {
      return tasksToSort
    }

    return [...tasksToSort].sort((a, b) => {
      if (sortOption === SORT_OPTIONS.PRIORITY_ASC) {
        return a.priority - b.priority // Low to High
      } else {
        return b.priority - a.priority // High to Low
      }
    })
  }

  // Function to filter tasks by search query
  const getFilteredTasks = () => {
    let filteredTasks = tasks

    // Apply category filter
    if (filterCategory) {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === filterCategory
      )
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.details && task.details.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    return sortTasks(filteredTasks)
  }

  // Function to get the current sort option text
  const getSortOptionText = () => {
    switch (sortOption) {
      case SORT_OPTIONS.PRIORITY_ASC:
        return 'Priority: Low to High'
      case SORT_OPTIONS.PRIORITY_DESC:
        return 'Priority: High to Low'
      default:
        return 'Sort Tasks'
    }
  }

  // Function to toggle task completion
  const toggleTaskCompletion = async (task: Task) => {
    if (!user) return

    try {
      const database = getDatabase()
      const taskRef = ref(database, `Users/${user.uid}/Tasks/${task.key}`)
      await set(taskRef, {
        ...task,
        isCompleted: !task.isCompleted,
      })
      fetchTasks()
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successMessage}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name='search'
            size={24}
            color='#666'
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search tasks...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode='while-editing'
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name='close' size={24} color='#666' />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* New Task Button */}
        <View style={styles.newTaskButtonContainer}>
          <MaterialIcons
            name='add'
            size={24}
            color='#fff'
            style={styles.newTaskButton}
            onPress={() => {
              resetForm() // Reset form values for new task
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

            {/* Category Selection */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text>Category: {selectedCategory}</Text>
              <MaterialIcons name='arrow-drop-down' size={24} color='#333' />
            </TouchableOpacity>

            {/* Priority Selection */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPriorityModal(true)}
            >
              <View style={styles.prioritySelector}>
                <Text>Priority: {PRIORITIES[selectedPriority].label}</Text>
                <View
                  style={[
                    styles.priorityIndicator,
                    { backgroundColor: PRIORITIES[selectedPriority].color },
                  ]}
                />
              </View>
              <MaterialIcons name='arrow-drop-down' size={24} color='#333' />
            </TouchableOpacity>

            {/* Due Date Selection */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>
                Due Date:{' '}
                {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}
              </Text>
              <MaterialIcons name='calendar-today' size={24} color='#333' />
            </TouchableOpacity>

            <MaterialIcons
              name='check'
              size={24}
              color='#4CAF50'
              style={styles.submitButton}
              onPress={handleTaskSubmit}
            />
          </View>
        )}

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          >
            <View
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalHeader}>Select Category</Text>
              {CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(category)
                    setShowCategoryModal(false)
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedCategory === category && styles.selectedModalItem,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Priority Modal */}
        <Modal
          visible={showPriorityModal}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowPriorityModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPriorityModal(false)}
          >
            <View
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalHeader}>Select Priority</Text>
              {PRIORITIES.map((priority, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPriority(index)
                    setShowPriorityModal(false)
                  }}
                >
                  <View style={styles.prioritySelector}>
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedPriority === index && styles.selectedModalItem,
                      ]}
                    >
                      {priority.label}
                    </Text>
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: priority.color },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Date Picker Modal */}
        {showDatePicker &&
          (Platform.OS === 'ios' ? (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType='fade'
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <DateTimePicker
                    value={dueDate ? new Date(dueDate) : new Date()}
                    mode='date'
                    display='spinner'
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDueDate(selectedDate.toISOString())
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.buttonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={dueDate ? new Date(dueDate) : new Date()}
              mode='date'
              display='default'
              onChange={(event, selectedDate) => {
                setShowDatePicker(false)
                if (selectedDate) {
                  setDueDate(selectedDate.toISOString())
                }
              }}
            />
          ))}

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSortModal(false)}
          >
            <View
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalHeader}>Sort By</Text>

              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSortOption(SORT_OPTIONS.NONE)
                  setShowSortModal(false)
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    sortOption === SORT_OPTIONS.NONE &&
                      styles.selectedModalItem,
                  ]}
                >
                  Default Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSortOption(SORT_OPTIONS.PRIORITY_ASC)
                  setShowSortModal(false)
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    sortOption === SORT_OPTIONS.PRIORITY_ASC &&
                      styles.selectedModalItem,
                  ]}
                >
                  Priority: Low to High
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSortOption(SORT_OPTIONS.PRIORITY_DESC)
                  setShowSortModal(false)
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    sortOption === SORT_OPTIONS.PRIORITY_DESC &&
                      styles.selectedModalItem,
                  ]}
                >
                  Priority: High to Low
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Display error message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Filter and Sort Controls */}
        <View style={styles.controlsContainer}>
          {/* Category Filter */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by: </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContainer}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterCategory === null && styles.activeFilterChip,
                ]}
                onPress={() => setFilterCategory(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterCategory === null && styles.activeFilterChipText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    filterCategory === category && styles.activeFilterChip,
                  ]}
                  onPress={() =>
                    setFilterCategory(
                      filterCategory === category ? null : category
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterCategory === category &&
                        styles.activeFilterChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Button */}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortButtonText}>{getSortOptionText()}</Text>
            <MaterialIcons name='sort' size={18} color='#4CAF50' />
          </TouchableOpacity>
        </View>

        {/* Tasks Section */}
        <View style={styles.taskSection}>
          <Text style={styles.header}>Tasks:</Text>
          <FlatList
            data={getFilteredTasks()}
            keyExtractor={(item) => item.key}
            renderItem={({ item, index }) => (
              <View>
                <View
                  style={[
                    styles.taskItem,
                    selectedTask === index && styles.selectedTaskItem,
                    {
                      borderLeftWidth: 5,
                      borderLeftColor: PRIORITIES[item.priority].color,
                    },
                    item.isCompleted && styles.completedTask,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleTaskCompletion(item)}
                  >
                    <MaterialIcons
                      name={
                        item.isCompleted
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={24}
                      color={item.isCompleted ? '#4CAF50' : '#333'}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.taskText,
                      item.isCompleted && styles.completedTaskText,
                    ]}
                    onPress={() => handleTaskPress(index)}
                  >
                    {`${index + 1}. ${item.name}`}
                  </Text>
                  {selectedTask === index && (
                    <View style={styles.iconContainer}>
                      <MaterialIcons
                        name='edit'
                        size={20}
                        color='#000'
                        style={styles.icon}
                        onPress={() => handleEditClick(item)}
                      />
                      <MaterialIcons
                        name='delete'
                        size={20}
                        color='#000'
                        style={styles.icon}
                        onPress={() => handleDeleteClick(item)}
                      />
                    </View>
                  )}
                </View>

                {/* Display details, category and priority when task is selected */}
                {selectedTask === index && (
                  <View style={styles.taskDetailsContainer}>
                    {item.details && (
                      <Text style={styles.taskDetails}>{item.details}</Text>
                    )}
                    <View style={styles.taskMeta}>
                      <Text style={styles.taskCategory}>
                        Category: {item.category}
                      </Text>
                      <View style={styles.taskPriority}>
                        <Text>Priority: {PRIORITIES[item.priority].label}</Text>
                        <View
                          style={[
                            styles.priorityIndicator,
                            {
                              backgroundColor: PRIORITIES[item.priority].color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    {item.dueDate && (
                      <Text style={styles.taskDueDate}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyList}>
                {filterCategory
                  ? `No tasks in ${filterCategory} category`
                  : 'No tasks available'}
              </Text>
            }
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
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  detailsInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dropdownButton: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  selectedModalItem: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  errorContainer: {
    justifyContent: 'center',
    marginTop: 5,
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'left',
  },
  controlsContainer: {
    marginBottom: 15,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterScrollContainer: {
    paddingBottom: 5,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  taskSection: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f8f8f8',
    marginBottom: 5,
    borderRadius: 5,
  },
  selectedTaskItem: {
    backgroundColor: '#eef5e9',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
  taskDetailsContainer: {
    backgroundColor: '#eef5e9',
    padding: 10,
    marginBottom: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  taskDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  taskCategory: {
    fontSize: 12,
    color: '#888',
  },
  taskPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    color: '#fff',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  icon: {
    marginLeft: 10,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  checkbox: {
    marginRight: 10,
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  successMessage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 15,
    zIndex: 1000,
  },
  successMessageText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
