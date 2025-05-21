// components/CreateLeagueForm.tsx
import DateTimePicker from '@react-native-community/datetimepicker'; // Required for date pickers
import { Picker } from '@react-native-picker/picker'; // You'll need to install this: `npx expo install @react-native-picker/picker`
import React, { useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CreateLeagueFormProps {
  onCreateLeague: (leagueData: { name: string; start_date: string; end_date?: string; status: string }) => void;
  onCancel: () => void;
}

const CreateLeagueForm: React.FC<CreateLeagueFormProps> = ({ onCreateLeague, onCancel }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState('upcoming'); // Default status

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSubmit = () => {
    if (!name || !startDate) {
      Alert.alert('Validation Error', 'League Name and Start Date are required.');
      return;
    }

    onCreateLeague({
      name,
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : undefined,
      status,
    });
  };

  const onStartDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  const onEndDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Create New League</Text>
      <TextInput
        style={styles.input}
        placeholder="League Name (e.g., Spring 2025)"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.datePickerRow}>
        <Text style={styles.label}>Start Date:</Text>
        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
          <Text>{startDate ? startDate.toLocaleDateString() : 'Select Date'}</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
      </View>

      <View style={styles.datePickerRow}>
        <Text style={styles.label}>End Date (Optional):</Text>
        <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
          <Text>{endDate ? endDate.toLocaleDateString() : 'Select Date'}</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
      </View>

      <Text style={styles.label}>League Status:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={status}
          onValueChange={(itemValue: string) => setStatus(itemValue)}
        >
          <Picker.Item label="Upcoming" value="upcoming" />
          <Picker.Item label="Active" value="active" />
          <Picker.Item label="Completed" value="completed" />
          <Picker.Item label="Archived" value="archived" />
        </Picker>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Create League" onPress={handleSubmit} />
        <Button title="Cancel" onPress={onCancel} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
  datePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFEFEF',
    borderRadius: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', // To ensure borderRadius applies to Picker on Android
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

export default CreateLeagueForm;