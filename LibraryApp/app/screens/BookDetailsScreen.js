import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const BookDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { isbn = "" } = route.params || {};
    const { libraryId = "" } = route.params || {};
    const [bookDetails, setBookDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isbn || !libraryId) {
            setError("Invalid book or library ID.");
            setLoading(false);
            return;
        }

        const fetchBookDetails = async () => {
            try {
                const response = await fetch(`http://193.136.62.24/v1/library/${libraryId}/book/${isbn}`);
                const data = await response.json();
                if (data && data.book) {
                    setBookDetails(data);
                } else {
                    setError("Book details not found.");
                }
            } catch (error) {
                console.error("Error fetching book details:", error);
                setError("Failed to fetch book details.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetails();
    }, [isbn, libraryId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const {
        book: {
            title = "Unknown Title",
            byStatement = "Unknown Author",
            description = "No Description",
        } = {},
        stock = "Unknown Stock",
        available = "Unknown Available",
        checkedOut = "Unknown Checked Out",
    } = bookDetails || {};

    const coverUrl = isbn ? `http://193.136.62.24/v1/assets/cover/${isbn}-M.jpg` : null;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            {coverUrl ? (
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    defaultSource={require('../../assets/placeholder_image.png')}
                />
            ) : (
                <Text style={styles.noCoverText}>No Cover Available</Text>
            )}

            <View style={styles.textContainer}>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Title: </Text>{title}
                </Text>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Author: </Text>{byStatement}
                </Text>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Description: </Text>{description}
                </Text>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Stock: </Text>{stock}
                </Text>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Available: </Text>{available}
                </Text>
                <Text style={styles.detailLabel}>
                    <Text style={styles.bold}>Checked Out: </Text>{checkedOut}
                </Text>
            </View>
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
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    textContainer: {
        flex: 1,
    },
    noCoverText: {
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 20,
        alignSelf: 'center',
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