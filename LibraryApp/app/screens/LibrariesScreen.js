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
    Button
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from "expo-router";
import { Accelerometer } from "expo-sensors";

const LibrariesScreen = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [newLibrary, setNewLibrary] = useState({
        name: '',
        address: '',
        openTime: '',
        closeTime: '',
        openDays: ''
    });
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

    const updateLibrary = async () => {
        if (!selectedLibrary) return;

        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${selectedLibrary.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedLibrary)
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Biblioteca atualizada com sucesso!');
                setEditModalVisible(false);
                fetchLibraries();
            } else {
                const errorData = await response.json();
                Alert.alert('Erro', errorData.message || 'Erro ao atualizar biblioteca.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Erro ao atualizar biblioteca.');
        }
    };

    const deleteLibrary = async (libraryId) => {
        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${libraryId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Biblioteca removida com sucesso!');
                fetchLibraries();
            } else if (response.status === 500) {
                Alert.alert(
                    'Erro',
                    'A biblioteca não pode ser removida porque contém livros associados.'
                );
            } else {
                const errorData = await response.json();
                Alert.alert('Erro', errorData.message || 'Erro ao remover biblioteca.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Erro ao remover biblioteca.');
        }
    };

    useEffect(() => {
        fetchLibraries();

        const subscription = Accelerometer.addListener(accelerometerData => {
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

    const renderCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: './LibraryBookScreen', params: { id: item.id } })}
            onLongPress={() => {
                Alert.alert(
                    "Ações",
                    `Escolha uma ação para "${item.name}"`,
                    [
                        {
                            text: "Editar",
                            onPress: () => {
                                setSelectedLibrary(item);
                                setEditModalVisible(true);
                            },
                        },
                        {
                            text: "Excluir",
                            onPress: () => deleteLibrary(item.id),
                            style: "destructive",
                        },
                        {
                            text: "Cancelar",
                            style: "cancel",
                        },
                    ],
                    { cancelable: true }
                );
            }}
        >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.details}>Horário: {item.openTime} - {item.closeTime}</Text>
            <Text style={styles.details}>Dias: {item.openDays}</Text>
        </TouchableOpacity>
    );

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

            {/* Modal de Adição */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    {/* Campos e botões de adição */}
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
        color: '#333', // Cor do título para contraste com o fundo
    },
    address: {
        fontSize: 14,
        color: '#666', // Cor do endereço ajustada para maior visibilidade
    },
    details: {
        fontSize: 14, // Tamanho de fonte ajustado
        color: '#333', // Certificando que o texto é visível em fundo branco
        marginTop: 4, // Adicionando espaçamento entre os elementos
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
        color: '#fff',
    },
    input: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
});

export default LibrariesScreen;