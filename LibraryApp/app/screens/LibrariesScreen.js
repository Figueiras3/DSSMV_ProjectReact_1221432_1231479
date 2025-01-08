import React, { useState, useEffect } from 'react';
import { Switch } from 'react-native';
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    Alert,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { router } from "expo-router";
import { Accelerometer } from "expo-sensors";
import CheckBox from '@react-native-community/checkbox';

const LibrariesScreen = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [newLibrary, setNewLibrary] = useState({
        name: '',
        address: '',
        openTime: '',
        closeTime: '',
        openDays: '',
    });
    const [showTimePicker, setShowTimePicker] = useState({
        openTime: false,
        closeTime: false,
    });

    const [selectedTime, setSelectedTime] = useState(null);
    const navigation = useNavigation();
    // Array com os dias da semana
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [showDaysPicker, setShowDaysPicker] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);


    const fetchLibraries = async () => {
        try {
            const response = await fetch('http://193.136.62.24/v1/library');
            const json = await response.json();
            setData(json);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    const deleteLibrary = async (libraryId) => {
        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${libraryId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Library deleted successfully.');
                fetchLibraries();
            } else {
                Alert.alert('Erro', 'Error deleting library.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Error deleting library.');
        }
    };

    const toggleDaySelection = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleEditLibrary = (library) => {
        setModalVisible(true);
        setNewLibrary({
            id: library.id, // Incluímos o ID para realizar a edição
            name: library.name,
            address: library.address,
            openTime: library.openTime,
            closeTime: library.closeTime,
            openDays: library.openDays,
        });
    };

    const handleDeleteLibrary = (library) => {
        Alert.alert(
            'Confirm Deletion',
            `Are you sure you want to delete the library "${library.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => deleteLibrary(library.id) },
            ]
        );
    };

    const handleLongPress = (library) => {
        Alert.alert(
            "Available action",
            `Choose an action for the library "${library.name}"`,
            [
                {
                    text: "Edit",
                    onPress: () => {
                        handleEditLibrary(library);
                    },
                },
                {
                    text: "Delete",
                    onPress: () => {
                        handleDeleteLibrary(library);
                    },
                    style: "destructive", // Define o botão como "perigoso" no iOS
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const renderCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onLongPress={() => {handleLongPress(item)}}
            onPress={() => router.push({ pathname: './LibraryBookScreen', params: { id: item.id } })}
        >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.details}>Horário: {item.openTime} - {item.closeTime}</Text>
            <Text style={styles.details}>Dias: {item.openDays}</Text>
        </TouchableOpacity>
    );

    const editLibrary = async () => {
        const { id, name, address, openTime, closeTime, openDays } = newLibrary;

        if (!name || !address || !openTime || !closeTime || !openDays) {
            Alert.alert('Erro', 'Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, address, openTime, closeTime, openDays }),
            });

            if (response.ok) {
                Alert.alert('Sucess', 'Library edited successfully!');
                setModalVisible(false);
                setNewLibrary({ name: '', address: '', openTime: '', closeTime: '', openDays: '' });
                fetchLibraries(); // Atualiza a lista após a edição
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Error editing library.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error editing library.');
        }
    };

    const addLibrary = async () => {
        const { name, address, openTime, closeTime, openDays } = newLibrary;

        if (!name || !address || !openTime || !closeTime || !openDays) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('http://193.136.62.24/v1/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newLibrary)
            });

            if (response.ok) {
                const addedLibrary = await response.json();
                setData(prevData => (prevData ? [addedLibrary, ...prevData] : [addedLibrary]));
                Alert.alert('Success', 'Library added successfully!');
                setModalVisible(false);
                setNewLibrary({ name: '', address: '', openTime: '', closeTime: '', openDays: '' });
                fetchLibraries();
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Error adding library.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error adding library.');
        }
    };

    useEffect(() => {
        fetchLibraries();

        const subscription = Accelerometer.addListener((accelerometerData) => {
            const { x, y, z } = accelerometerData;

            if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5 || Math.abs(z) > 1.5) {
                setModalVisible(true);
            }
        });

        Accelerometer.setUpdateInterval(100);

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCard}
                    contentContainerStyle={styles.list}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {setModalVisible(true);
                setShowTimePicker({ openTime: false, closeTime: false }); }}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Menu de Contexto */}
            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <View style={styles.menuOverlay}>
                    <View style={styles.menu}>
                        <Button
                            title="Edit"
                            onPress={() => {
                                handleEditLibrary(selectedLibrary);
                                setMenuVisible(false);
                            }}
                        />
                        <Button
                            title="Delete"
                            onPress={() => {
                                handleDeleteLibrary(selectedLibrary);
                                setMenuVisible(false);
                            }}
                            color="red"
                        />
                        <Button
                            title="Cancel"
                            onPress={() => setMenuVisible(false)}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Adição/Edição */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, width: '90%' }}>
                        <Text style={styles.modalTitle}>
                            {newLibrary.id ? 'Edit Library' : 'Delete Library'}
                        </Text>

                        {/* Nome da Biblioteca */}
                        <TextInput
                            style={styles.input}
                            placeholder="Library Name"
                            placeholderTextColor="rgba(0, 0, 0, 0.2)"
                            value={newLibrary.name}
                            onChangeText={(text) => setNewLibrary({ ...newLibrary, name: text })}
                        />

                        {/* Morada */}
                        <TextInput
                            style={styles.input}
                            placeholder="Adress"
                            placeholderTextColor="rgba(0, 0, 0, 0.2)"
                            value={newLibrary.address}
                            onChangeText={(text) => setNewLibrary({ ...newLibrary, address: text })}
                        />

                        {/* Bot찾o para abrir o rel처gio de Hora de Abertura */}
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker({ ...showTimePicker, openTime: true })}
                        >
                            <Text style={styles.timeButtonText}>
                                {newLibrary.openTime ? `Open Time: ${newLibrary.openTime}` : "Open Time (00:00)"}
                            </Text>
                        </TouchableOpacity>

                        {/* Modal para Hora de Abertura */}
                        <Modal
                            transparent={true}
                            visible={showTimePicker.openTime}
                            animationType="slide"
                            onRequestClose={() => setShowTimePicker({ ...showTimePicker, openTime: false })}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <DateTimePicker
                                        value={selectedTime || new Date()}
                                        mode="time"
                                        is24Hour={true}
                                        display="spinner"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setSelectedTime(selectedDate); // Atualiza a hora selecionada
                                            }
                                        }}
                                    />
                                    <View style={styles.modalButtonContainer}>
                                        <Button
                                            title="Cancel"
                                            onPress={() => {
                                                setShowTimePicker({ ...showTimePicker, openTime: false });
                                                setSelectedTime(null); // Reseta o valor
                                            }}
                                            color="#f44336" // Vermelho
                                        />
                                        <Button
                                            title="Confirm"
                                            onPress={() => {
                                                if (selectedTime) {
                                                    const hours = selectedTime.getHours().toString().padStart(2, '0');
                                                    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                                                    setNewLibrary({ ...newLibrary, openTime: `${hours}:${minutes}` });
                                                }
                                                setShowTimePicker({ ...showTimePicker, openTime: false }); // Fecha o modal
                                            }}
                                            color="#6200ee" // Azul ou cor principal
                                        />
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* Botão para abrir o relógio de Hora de Fecho */}
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker({ ...showTimePicker, closeTime: true })}
                        >
                            <Text style={styles.timeButtonText}>
                                {newLibrary.closeTime ? `Close Time: ${newLibrary.closeTime}` : "Close Time (00:00)"}
                            </Text>
                        </TouchableOpacity>

                        {/* Modal para Hora de Fecho */}
                        <Modal
                            transparent={true}
                            visible={showTimePicker.closeTime}
                            animationType="slide"
                            onRequestClose={() => setShowTimePicker({ ...showTimePicker, closeTime: false })}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <DateTimePicker
                                        value={selectedTime || new Date()}
                                        mode="time"
                                        is24Hour={true}
                                        display="spinner"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setSelectedTime(selectedDate); // Atualiza a hora selecionada
                                            }
                                        }}
                                    />
                                    <View style={styles.modalButtonContainer}>
                                        <Button
                                            title="Cancel"
                                            onPress={() => {
                                                setShowTimePicker({ ...showTimePicker, closeTime: false });
                                                setSelectedTime(null); // Reseta o valor
                                            }}
                                            color="#f44336" // Vermelho
                                        />
                                        <Button
                                            title="Confirm"
                                            onPress={() => {
                                                if (selectedTime) {
                                                    const hours = selectedTime.getHours().toString().padStart(2, '0');
                                                    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                                                    setNewLibrary({ ...newLibrary, closeTime: `${hours}:${minutes}` });
                                                }
                                                setShowTimePicker({ ...showTimePicker, closeTime: false }); // Fecha o modal
                                            }}
                                            color="#6200ee" // Azul ou cor principal
                                        />
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* Botão para abrir seleção de Dias de Abertura */}
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowDaysPicker(true)}
                        >
                            <Text style={styles.timeButtonText}>
                                {newLibrary.openDays ? `Open days: ${newLibrary.openDays}` : "Select Opening Days"}
                            </Text>
                        </TouchableOpacity>

                        {/* Modal para Seleção de Dias */}
                        <Modal
                            transparent={true}
                            visible={showDaysPicker}
                            animationType="slide"
                            onRequestClose={() => setShowDaysPicker(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.modalTitle}>Select Opening Days</Text>

                                    {/* Switches para os dias da semana */}
                                    {daysOfWeek.map((day, index) => (
                                        <View key={index} style={styles.switchContainer}>
                                            <Switch
                                                value={selectedDays.includes(day)}
                                                onValueChange={() => toggleDaySelection(day)}
                                                thumbColor={selectedDays.includes(day) ? "#6200ee" : "#ccc"} // Cor do botão
                                                trackColor={{ false: "#ddd", true: "#b39ddb" }} // Cor do fundo
                                            />
                                            <Text style={styles.switchLabel}>{day}</Text>
                                        </View>
                                    ))}

                                    {/* Botões de Cancelar e Confirmar */}
                                    <View style={styles.modalButtonContainer}>
                                        <Button
                                            title="Cancel"
                                            onPress={() => {
                                                setShowDaysPicker(false);
                                            }}
                                            color="#f44336" // Vermelho
                                        />
                                        <Button
                                            title="Confirm"
                                            onPress={() => {
                                                setNewLibrary({ ...newLibrary, openDays: selectedDays.join(', ') });
                                                setShowDaysPicker(false); // Fecha o modal
                                            }}
                                            color="#6200ee" // Azul ou cor principal
                                        />
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancel"
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewLibrary({ name: '', address: '', openTime: '', closeTime: '', openDays: '' });
                                }}
                                color="#6200ee"
                            />
                            <Button
                                title="Save changes"
                                onPress={() => {
                                    if (newLibrary.id) {
                                        editLibrary();
                                    } else {
                                        addLibrary();
                                    }
                                }}
                                color="#03dac6"
                            />
                        </View>
                    </View>
                </View>
            </Modal>


        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loading: {
        marginTop: 20,
    },
    list: {
        paddingVertical: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    address: {
        fontSize: 14,
        color: '#666',
    },
    details: {
        fontSize: 14,
        color: '#333',
        marginTop: 4,
    },
    backButton: {
        backgroundColor: '#6200ee',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#6200ee',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fabText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000000',
    },
    input: {
        backgroundColor: '#fff', // Fundo branco para contraste
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        color: '#000', // Cor do texto principal (entrada)
        fontSize: 16, // Tamanho do texto para melhorar a visibilidade
        placeholderTextColor: '#666', // Adicione esta linha no componente TextInput
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    button: {
        color: '#6200ee', // Certifique-se de que os botões têm contraste adequado
    },
    menuOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menu: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: 250,
    },
    timeButton: {
        backgroundColor: '#6200ee',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    timeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        width: '80%',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    switchLabel: {
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
    },
});

export default LibrariesScreen;
