// Booking related functions
// Search for available trips
async function searchTrips(from, to, date) {
    try {
        const response = await fetch(`${API_BASE}/vehicles/trips/search?from=${from}&to=${to}&date=${date}`);
        return await response.json();
    } catch (error) {
        console.error('Error searching trips:', error);
        return [];
    }
}

// Create a new booking
async function createBooking(tripId, seatsBooked) {
    try {
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                trip_id: tripId,
                seats_booked: seatsBooked
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

// Get user's bookings
async function getUserBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings/my-bookings`, {
            headers: getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
}