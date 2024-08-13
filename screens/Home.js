import React, { useEffect, useState } from "react";
import { Text, Alert, StyleSheet, ScrollView, TouchableOpacity, TextInput, View, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';

const Home = ({ navigation }) => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [entries, setEntries] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadEntries = async () => {
        try {
            const savedEntries = await AsyncStorage.getItem('entries');
            if (savedEntries) {
                setEntries(JSON.parse(savedEntries).map(entry => ({
                    ...entry,
                    date: new Date(entry.date)
                })));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load data.');
        }
    };

    useEffect(() => {
        loadEntries();
    }, []);

    const addEntry = async () => {
        if (!name || isNaN(cost)) {
            Alert.alert('Invalid input', 'Please enter a valid name and cost.');
            return;
        }

        const newEntry = {
            name,
            cost: parseFloat(cost),
            date: new Date()
        };

        const updatedEntries = [...entries, newEntry];
        setEntries(updatedEntries);

        try {
            await AsyncStorage.setItem('entries', JSON.stringify(updatedEntries));
            setName('');
            setCost('');
        } catch (error) {
            Alert.alert('Error', 'Failed to save data.');
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString(); // Months are zero-based, so +1
        const year = d.getFullYear();
        const neatDate = `${day} - ${month} - ${year}`;
        return `${day}/${month}/${year}`;
    };

    const groupByDate = (entries) => {
        const filteredEntries = entries.filter(entry => {
            const matchName = entry.name.toLowerCase().includes(nameFilter.toLowerCase());
            return matchName;
        });
    
        const grouped = filteredEntries.reduce((groups, entry) => {
            const dateKey = formatDate(entry.date);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
            return groups;
        }, {});
    
        // Sort grouped entries by date in descending order
        return Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a)) // Sort by date in descending order
            .reduce((sortedGroups, key) => {
                sortedGroups[key] = grouped[key];
                return sortedGroups;
            }, {});
    };
    

    const groupEntries = groupByDate(entries);

    const removeAllEntries = async () => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete all entries?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel'
                },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('entries');
                            setEntries([]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete all entries.');
                            console.error('Delete all entries error: ', error);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const handleRemoveEntry = (entry) => {
        Alert.alert(
            'Confirm Deletion',
            `Are you sure you want to delete ${entry.name}'s entry`,
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel'
                },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            const updatedEntries = entries.filter(e => e.date.getTime() !== entry.date.getTime());
                            setEntries(updatedEntries);
                            await AsyncStorage.setItem('entries', JSON.stringify(updatedEntries));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete the entry.');
                            console.error('Delete entry error: ', error);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const generateFileContent = () => {
        // Create a variable to hold the content
        let content = '';
        
        // Iterate through each date and its associated entries
        Object.keys(groupEntries).forEach(dateKey => {
            // For each date, get the entries
            groupEntries[dateKey].forEach(entry => {
                // Append name and cost for each entry
                content += `Name: ${entry.name}\n${dateKey} - ₹ ${entry.cost.toFixed(2)}\n\n`;
            });
            content += '\n'; // Add a new line between dates
        });
        
        return content;
    };
    

    const copyToClipboard = async () => {
        const content = generateFileContent();
        try {
            await Clipboard.setStringAsync(content);
            Alert.alert('Copied!', 'Entries copied!');
        } catch (error) {
            Alert.alert('Error', 'Failed to copy the content.');
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadEntries();
        setRefreshing(false);
    };

    const restartApp = async () => {
        try {
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Failed to reload app', error);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Home</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.minimalButton} onPress={restartApp}>
                    <Text style={styles.minimalButtonText}>Restart</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Cost"
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
            />

            <TouchableOpacity style={styles.button} onPress={addEntry}>
                <Text style={styles.buttonText}>Add Entry</Text>
            </TouchableOpacity>

            <View style={styles.filterContainer}>
                <TextInput
                    style={styles.filterInput}
                    placeholder="Filter by Name"
                    value={nameFilter}
                    onChangeText={setNameFilter}
                />
                <TouchableOpacity
                    style={styles.minimalButton}
                    onPress={() => setNameFilter('')}
                >
                    <Text style={styles.minimalButtonText}>Clear Filter</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.minimalButton} onPress={copyToClipboard}>
                <Text style={styles.minimalButtonText}>Copy Records</Text>
            </TouchableOpacity>

            {Object.keys(groupEntries).map((dateKey, index) => (
                <View style={styles.entryBox} key={index}>
                    <Text style={{ fontSize: 18, }}>{dateKey}</Text>
                    {groupEntries[dateKey].map((entry, entryIndex) => (
                        <View key={entryIndex} style={styles.innerEntryBox}>
                            <View style={styles.entryContent}>
                                <Text style={styles.resultText}>{entry.name}</Text>
                                <Text style={styles.resultText}>₹ {entry.cost.toFixed(2)}</Text>
                                <TouchableOpacity onPress={() => handleRemoveEntry(entry)}>
                                    <Icon name='delete' size={20} color='red' />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            ))}
            
            <TouchableOpacity style={styles.clearButton} onPress={removeAllEntries}>
                <Text style={styles.clearButtonText}>Clear All Entries</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F4F1F9', // Light purple background
        padding: 20,
    },
    headerContainer: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#F4F1F9',
        paddingVertical: 10,
        zIndex: 1,
    },
    header: {
        fontSize: 26,
        fontWeight: '700',
        color: '#3D0A4A', // Dark purple color
        textAlign: 'center',
    },
    input: {
        borderColor: '#D1C4E9', // Light purple border
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginVertical: 10,
        backgroundColor: '#FFFFFF', // White background
        shadowColor: '#D1C4E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderColor: '#D1C4E9',
    },
    button: {
        backgroundColor: '#4A148C', // Purple color
        paddingVertical: 15,
        borderRadius: 10,
        marginVertical: 10,
        elevation: 14,
        shadowColor: '#4A148C'
    },
    buttonText: {
        color: '#FFFFFF', // White text
        textAlign: 'center',
        fontSize: 18,
    },
    clearButton: {
        backgroundColor: '#E57373', // Red color
        paddingVertical: 15,
        borderRadius: 10,
        marginVertical: 10,
        elevation: 8,
        shadowColor: '#E57373'
    },
    clearButtonText: {
        color: '#FFFFFF', // White text
        textAlign: 'center',
        fontSize: 18,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    filterInput: {
        borderColor: '#D1C4E9',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        flex: 1,
        marginRight: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#D1C4E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    minimalButton: {
        backgroundColor: '#B39DDB', // Light purple color
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginVertical: 5,
        elevation: 14,
        shadowColor: '#3D0A4A'
    },
    minimalButtonText: {
        color: '#3D0A4A', // Dark purple color
        textAlign: 'center',
        fontSize: 16,
        elevation: 8,
        shadowColor: '#3D0A4A'
    },
    entryBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#D1C4E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#D1C4E9'
    },
    innerEntryBox: {
        borderBottomWidth: 1,
        borderBottomColor: '#D1C4E9',
        paddingVertical: 10,
    },
    entryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap', 
    },
    resultText: {
        fontSize: 16,
        color: '#3D0A4A',
        flex: 1, 
        flexShrink: 1, 
        marginRight: 10, 
    },
});

export default Home;
