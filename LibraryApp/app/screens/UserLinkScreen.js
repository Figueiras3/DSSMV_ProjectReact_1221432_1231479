import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const UserLinkScreen = () => {
    const { username } = useLocalSearchParams(); // Pega o username passado como parâmetro
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter(); // Para lidar com navegação

    useEffect(() => {
        if (username) {
            fetchBooksByUser(username); // Certifique-se de que username é uma string
        } else {
            Alert.alert('Error', 'No username provided!');
            setLoading(false);
        }
    }, [username]);

    const fetchBooksByUser = async (username) => {
        try {
            const response = await fetch(`http://193.136.62.24/v1/books/user/${username}`);
            const data = await response.json();
            setBooks(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not fetch books for the user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Botão de Voltar */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.header}>
                Books associated with <Text style={styles.username}>{username}</Text>
            </Text>

            {loading ? (
                <Text style={styles.loading}>Loading...</Text>
            ) : books.length > 0 ? (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.book.isbn}
                    renderItem={({ item }) => (
                        <View style={styles.bookCard}>
                            <Text style={styles.title}>Title: {item.book.title}</Text>
                            <Text style={styles.author}>
                                Author: {item.book.authors?.[0]?.name || 'Unknown Author'}
                            </Text>
                        </View>
                    )}
                />
            ) : (
                <Text style={styles.noBooks}>No books found for this user.</Text>
            )}
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
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    username: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    loading: {
        marginTop: 20,
        textAlign: 'center',
    },
    noBooks: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
    },
    bookCard: {
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
        marginBottom: 5,
    },
    author: {
        fontSize: 14,
        color: '#555',
    },
});

export default UserLinkScreen;
