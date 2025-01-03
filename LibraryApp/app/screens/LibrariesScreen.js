import React, { useState, useEffect } from 'react';
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
    const [showTimePicker, setShowTimePicker] = useState({ openTime: false, closeTime: false });
    const [selectedTime, setSelectedTime] = useState(null);
    const navigation = useNavigation();

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
                Alert.alert('Sucesso', 'Biblioteca excluída com sucesso.');
                fetchLibraries();
            } else {
                Alert.alert('Erro', 'Erro ao excluir biblioteca.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Erro ao excluir biblioteca.');
        }
    };

    const handleEditLibrary = (library) => {
        setModalVisible(true);
        setNewLibrary(library);
    };

    const handleDeleteLibrary = (library) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir a biblioteca "${library.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', onPress: () => deleteLibrary(library.id) },
            ]
        );
    };

    const renderCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onLongPress={() => {
                setSelectedLibrary(item);
                setMenuVisible(true);
            }}
            onPress={() => router.push({ pathname: './LibraryBookScreen', params: { id: item.id } })}
        >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.details}>Horário: {item.openTime} - {item.closeTime}</Text>
            <Text style={styles.details}>Dias: {item.openDays}</Text>
        </TouchableOpacity>
    );

    const addLibrary = async () => {
        const { name, address, openTime, closeTime, openDays } = newLibrary;

        if (!name || !address || !openTime || !closeTime || !openDays) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
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
                Alert.alert('Sucesso', 'Biblioteca adicionada com sucesso!');
                setModalVisible(false);
                setNewLibrary({ name: '', address: '', openTime: '', closeTime: '', openDays: '' });
                fetchLibraries();
            } else {
                const errorData = await response.json();
                Alert.alert('Erro', errorData.message || 'Erro ao adicionar biblioteca.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Erro ao adicionar biblioteca.');
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
                onPress={() => setModalVisible(true)}
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
                            title="Editar"
                            onPress={() => {
                                handleEditLibrary(selectedLibrary);
                                setMenuVisible(false);
                            }}
                        />
                        <Button
                            title="Excluir"
                            onPress={() => {
                                handleDeleteLibrary(selectedLibrary);
                                setMenuVisible(false);
                            }}
                            color="red"
                        />
                        <Button
                            title="Cancelar"
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
                            {newLibrary.id ? 'Editar Biblioteca' : 'Adicionar Biblioteca'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nome da Biblioteca"
                            value={newLibrary.name}
                            onChangeText={(text) => setNewLibrary({ ...newLibrary, name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Morada"
                            value={newLibrary.address}
                            onChangeText={(text) => setNewLibrary({ ...newLibrary, address: text })}
                        />

                        <Text>Hora de Abertura</Text>
                        <Button
                            title={newLibrary.openTime || "Selecionar Hora de Abertura"}
                            onPress={() => setShowTimePicker({ ...showTimePicker, openTime: true })}
                        />
                        {showTimePicker.openTime && (
                            <DateTimePicker
                                mode="time"
                                value={new Date()}
                                onChange={(event, selectedDate) => handleTimeChange(event, selectedDate, 'openTime')}
                            />
                        )}

                        <Text>Hora de Fecho</Text>
                        <Button
                            title={newLibrary.closeTime || "Selecionar Hora de Fecho"}
                            onPress={() => setShowTimePicker({ ...showTimePicker, closeTime: true })}
                        />
                        {showTimePicker.closeTime && (
                            <DateTimePicker
                                mode="time"
                                value={new Date()}
                                onChange={(event, selectedDate) => handleTimeChange(event, selectedDate, 'closeTime')}
                            />
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Dias de Abertura (ex: Seg-Sex)"
                            value={newLibrary.openDays}
                            onChangeText={(text) => setNewLibrary({ ...newLibrary, openDays: text })}
                        />

                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancelar"
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewLibrary({ name: '', address: '', openTime: '', closeTime: '', openDays: '' });
                                }}
                                color="#6200ee"
                            />
                            <Button
                                title={newLibrary.id ? 'Salvar Alterações' : 'Adicionar'}
                                onPress={() => {
                                    addLibrary()
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
        backgroundColor: '#fff',
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        color: '#000000',
        borderWidth: 1,
        borderColor: '#ccc',
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
});

export default LibrariesScreen;
