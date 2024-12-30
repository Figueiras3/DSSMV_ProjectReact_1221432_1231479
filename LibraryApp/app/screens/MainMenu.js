import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function MainMenu() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={() => router.push('./screens/LibrariesScreen')}>
                <Text style={styles.buttonText}>View Libraries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('./screens/UsernameScreen')}>
                <Text style={styles.buttonText}>View Users</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    button: {
        backgroundColor: '#6200ee',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
