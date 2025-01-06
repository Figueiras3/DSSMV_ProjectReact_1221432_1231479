import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Image, Button } from 'react-native';
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
            const response = await fetch(`http://193.136.62.24/v1/user/checked-out?userId=${username}`);
            if (!response.ok) {
                throw new Error(`Error fetching books: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response structure from API.");
            }

            setBooks(data); // Certifique-se de que a estrutura é compatível
        } catch (error) {
            console.error("Failed to fetch books:", error);
            Alert.alert("Error", "Could not fetch books for the user.");
        } finally {
            setLoading(false);
        }
    };

    const performCheckIn = async (libraryId, isbn) => {
        try {
            // Função para formatar UUID
            const formatUUID = (id) => {
                if (id.length !== 32) {
                    throw new Error("Invalid UUID length. It must be 32 characters without dashes.");
                }
                return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
            };

            let formattedLibraryId;
            try {
                formattedLibraryId = formatUUID(libraryId); // Garante que esteja no formato correto
            } catch (error) {
                console.error("Error formatting libraryId:", error.message);
                Alert.alert("Error", "Invalid Library ID format.");
                return;
            }

            const response = await fetch(`http://193.136.62.24/v1/library/${formattedLibraryId}/book/${isbn}/checkin?userId=${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    libraryId: formattedLibraryId,
                    isbn: isbn,
                    username: username,
                }),
            });

            const responseText = await response.text(); // Pega a resposta como texto
            let responseData;

            if (responseText) {
                try {
                    responseData = JSON.parse(responseText); // Tenta converter para JSON
                } catch (error) {
                    console.error("Invalid JSON response:", responseText);
                    throw new Error("Unexpected response format.");
                }
            }

            console.log('Response data:', responseData); // Mostra detalhes da resposta

            if (response.ok) {
                Alert.alert("Success", "Check-in realizado com sucesso!");
                fetchBooksByUser(username); // Atualiza a lista de livros
            } else {
                const errorMessage = responseData?.message || response.statusText || "Unknown error";
                throw new Error(`Erro ao realizar o check-in: ${errorMessage}`);
            }

        } catch (error) {
            console.error("Check-in failed:", error);
            Alert.alert("Error", error.message || "Não foi possível realizar o check-in.");
        }
    };

    const fetchBookCover = (isbn) => {
        if (isbn) {
            return `http://193.136.62.24/v1/assets/cover/${isbn}-M.jpg`;
        }
        return null;
    };

    const handleLongPress = (libraryId, isbn) => {
        Alert.alert(
            "Choose an Action",
            "What would you like to do?",
            [
                {
                    text: "Extend",
                    onPress: () => handleExtend(libraryId, isbn),
                },
                {
                    text: "Check-In",
                    onPress: () => performCheckIn(libraryId, isbn),
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const handleExtend = async (libraryId, isbn) => {
        try {
            const response = await fetch(
                `http://193.136.62.24/v1/library/${libraryId}/book/${isbn}/extend?userId=${username}`,
                { method: "POST" }
            );

            if (response.ok) {
                Alert.alert("Success", "The due date has been extended!");
                fetchBooksByUser(username); // Atualiza a lista de livros
            } else {
                const errorText = await response.text();
                console.error("Extend failed:", errorText);
                throw new Error("Could not extend the due date.");
            }
        } catch (error) {
            console.error("Extend error:", error);
            Alert.alert("Error", error.message || "Failed to extend the due date.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Botão de Voltar */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>Back</Text>
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
                        <TouchableOpacity
                            style={styles.bookCard}
                            onLongPress={() => handleLongPress(item.libraryId, item.book.isbn)}
                        >
                            <View style={styles.bookInfoContainer}>
                                {/* Imagem da Capa */}
                                {fetchBookCover(item.book.isbn) ? (
                                    <Image
                                        source={{ uri: fetchBookCover(item.book.isbn) }}
                                        style={styles.coverImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Text style={styles.noCover}>No cover available</Text>
                                )}
                                {/* Detalhes do Livro */}
                                <View style={styles.bookDetails}>
                                    <Text style={styles.title}>Title: {item.book.title}</Text>
                                    <Text style={styles.author}>
                                        Author: {item.book.authors?.[0]?.name || 'Unknown Author'}
                                    </Text>
                                    {/* Exibe a dueDate */}
                                    {item.dueDate && (
                                        <Text style={styles.dueDate}>
                                            Due Date: {new Date(item.dueDate).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
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

    noBooks: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
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
    noCover: {
        fontSize: 12,
        color: '#999',
        marginVertical: 10,
    },
    bookInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    bookDetails: {
        flex: 1,
        marginLeft: 10,
    },
    coverImage: {
        width: 80,
        height: 120,
        borderRadius: 4,
    },
    checkInButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#6200ee',
        borderRadius: 8,
        alignSelf: 'flex-start', // Alinha o botão no início do container
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    checkInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dueDate: {
        fontSize: 14,
        color: '#d32f2f', // Vermelho para chamar atenção
        marginTop: 5,
    },


});

export default UserLinkScreen;
