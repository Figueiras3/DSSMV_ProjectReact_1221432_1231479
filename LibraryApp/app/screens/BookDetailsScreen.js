import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const BookDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { isbn = "" } = route.params || {}; // ISBN para buscar os dados

    // States para armazenar os dados do livro
    const [bookDetails, setBookDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para buscar os dados do livro
    useEffect(() => {
        if (!isbn) return; // Se não houver ISBN, não faz nada

        const fetchBookDetails = async () => {
            try {
                const response = await fetch(`http://193.136.62.24/v1/books/${isbn}`);
                const data = await response.json();
                console.log(data); // Verificar o que está sendo retornado pela API

                if (data && data.title) {
                    setBookDetails(data); // Assumindo que a resposta da API tem uma chave 'title'
                } else {
                    setError("Book details not found.");
                }
            } catch (error) {
                setError("Failed to fetch book details.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetails();
    }, [isbn]);

    // Caso os dados ainda estejam carregando
    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    // Caso haja erro ao buscar os dados
    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Desestruturando os dados do livro
    const { title = "Unknown Title", author = "Unknown Author", description = "No Description", stock = "Unknown Stock" } = bookDetails || {};

    const coverUrl = isbn ? `http://193.136.62.24/v1/assets/cover/${isbn}-L.jpg` : null;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            {/* Image section - Centralized */}
            {coverUrl ? (
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    defaultSource={require('../../assets/placeholder_image.png')} // Substitua com o caminho da sua imagem de placeholder
                />
            ) : (
                <Text style={styles.noCoverText}>No Cover Available</Text>
            )}

            {/* Book Details */}
            <Text style={styles.detailLabel}>
                <Text style={styles.bold}>Title: </Text>{title}
            </Text>
            <Text style={styles.detailLabel}>
                <Text style={styles.bold}>Author: </Text>{author}
            </Text>
            <Text style={styles.detailLabel}>
                <Text style={styles.bold}>Description: </Text>{description}
            </Text>
            <Text style={styles.detailLabel}>
                <Text style={styles.bold}>Stock: </Text>{stock}
            </Text>
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
    coverImage: {
        width: 200,
        height: 300,
        resizeMode: 'contain',
        marginBottom: 20,
        alignSelf: 'center', // This centers the image horizontally
    },
    noCoverText: {
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 20,
        alignSelf: 'center', // Centers the text if cover is not available
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    detailLabel: {
        fontSize: 18,
        marginBottom: 10,
    },
    bold: {
        fontWeight: 'bold',
    },
});

export default BookDetailsScreen;
