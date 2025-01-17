import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    Button,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { router } from "expo-router";

const LibraryBookScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id: libraryId } = route.params;

    const [books, setBooks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isbn, setIsbn] = useState('');
    const [stock, setStock] = useState('');

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${libraryId}/book`);
            const json = await response.json();
            const booksData = json.map(item => ({
                isbn: item.isbn,
                title: item.book.title,
                authors: item.book.authors.map(author => ({ name: author.name })),
                cover: item.book.cover,
                available: item.available,
            }));
            setBooks(booksData);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to fetch books.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (isbn, username) => {
        try {
            const response = await fetch(
                `http://193.136.62.24/v1/library/${libraryId}/book/${isbn}/checkout?userId=${username}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username }),
                }
            );

            if (response.ok) {
                Alert.alert('Success', 'Book checked out successfully!');
                fetchBooks(); // Refresh the list
            } else {
                const errorText = await response.text();
                Alert.alert('Error', `Failed to checkout the book: ${errorText}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to checkout the book.');
        }
    };

    const addBookToLibrary = async () => {
        if (!isbn || !stock) {
            Alert.alert('Error', 'ISBN and stock are required.');
            return;
        }

        try {
            const response = await fetch(`http://193.136.62.24/v1/library/${libraryId}/book/${isbn}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: parseInt(stock) }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Book added successfully!');
                fetchBooks(); // Refresh the list
                setModalVisible(false);
                setIsbn('');
                setStock('');
            } else {
                const errorText = await response.text();
                Alert.alert('Error', `Failed to add the book: ${errorText}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to add the book.');
        }
    };

    const confirmCheckout = (isbn, title, available) => {
        if (available <= 0) {
            Alert.alert('Not Available', `The book "${title}" is not currently available.`);
            return;
        }

        Alert.prompt(
            'Checkout Book',
            `Enter the name of the client for "${title}"`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Checkout',
                    onPress: (username) => {
                        if (username) {
                            handleCheckout(isbn, username);
                        } else {
                            Alert.alert('Error', 'Client name is required.');
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const renderBook = ({ item }) => {
        const coverUrl = `http://193.136.62.24/v1/assets/cover/${item.isbn}-M.jpg`;

        return (
            <TouchableOpacity
                style={styles.card}

                onPress={() => router.push({ pathname: './BookDetailsScreen', params: { isbn: item.isbn, libraryId} })}
                onLongPress={() => confirmCheckout(item.isbn, item.title, item.available)}
            >
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.author}>Author: {item.authors.map(a => a.name).join(', ')}</Text>
                    <Text style={[styles.status, { color: item.available > 0 ? '#28a745' : '#dc3545' }]}>
                        {item.available > 0 ? `${item.available} Available` : 'Not Available'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

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
            ) : books && books.length > 0 ? (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.isbn}
                    renderItem={renderBook}
                    contentContainerStyle={styles.list}
                />
            ) : (
                <Text style={styles.noData}>No books available for this library.</Text>
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Add Book</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Book</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter ISBN"
                            value={isbn}
                            onChangeText={setIsbn}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Stock"
                            keyboardType="numeric"
                            value={stock}
                            onChangeText={setStock}
                        />
                        <Button title="Add" onPress={addBookToLibrary} />
                        <Button title="Cancel" color="#888" onPress={() => setModalVisible(false)} />
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
    loading: {
        marginTop: 20,
    },
    list: {
        paddingVertical: 10,
    },
    coverImage: {
        width: 50,
        height: 75,
        borderRadius: 4,
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
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
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    author: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
    },
    noData: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#6200ee',
        borderRadius: 30,
        padding: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 16,
        padding: 8,
    },
});

export default LibraryBookScreen;