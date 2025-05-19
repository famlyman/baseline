import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type OnCreateSeasonHandler = (seasonData: {
  name: string;
  start_date: string | undefined;
  end_date: string | undefined;
}) => void;

type OnCancelHandler = () => void;

interface CreateSeasonFormProps {
  onCreateSeason: OnCreateSeasonHandler;
  onCancel: OnCancelHandler;
}

const CreateSeasonForm: React.FC<CreateSeasonFormProps> = ({ onCreateSeason, onCancel }) => {
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleStartDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    if (seasonName && startDate) {
      onCreateSeason({ name: seasonName, start_date: startDate?.toISOString(), end_date: endDate?.toISOString() });
      setSeasonName('');
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      alert('Season Name and Start Date are required.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Season</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Season Name:</Text>
        <TextInput
          style={styles.input}
          value={seasonName}
          onChangeText={setSeasonName}
          placeholder="e.g., Spring 2025"
        />
      </View>

      <View style={styles.datePickerContainer}>
        <View style={styles.dateInputContainer}>
          <Text style={styles.label}>Start Date:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
            <Text>{startDate ? startDate.toLocaleDateString() : 'Select Start Date'}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={startDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleStartDateChange}
            />
          )}
        </View>

        <View style={styles.dateInputContainer}>
          <Text style={styles.label}>End Date (Optional):</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
            <Text>{endDate ? endDate.toLocaleDateString() : 'Select End Date (Optional)'}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={endDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleEndDateChange}
            />
          )}
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Season</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  datePickerContainer: {
    marginBottom: 15,
  },
  dateInputContainer: {
    marginBottom: 10,
  },
  dateButton: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#B00020',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateSeasonForm;