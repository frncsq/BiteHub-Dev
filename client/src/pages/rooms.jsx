import Header from "../components/header"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { mockRestaurantsData } from "../services/mockData"

function Rooms() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [retryCount, setRetryCount] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [sortBy, setSortBy] = useState("price-asc")

    const navigate = useNavigate()
    const MAX_RETRIES = 3

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            setError("")
            
            // Load rooms data
            await new Promise(resolve => setTimeout(resolve, 500))
            setRooms(mockRestaurantsData)
        } catch (err) {
            console.error("Error fetching rooms:", err)
            setError("Unable to load rooms. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    const handleRetry = async () => {
        if (retryCount < MAX_RETRIES) {
            setRetryCount(retryCount + 1)
            await fetchRooms()
        }
    }

    // Filter and sort rooms
    const getFilteredAndSortedRooms = () => {
        let filtered = rooms.filter(room => {
            const matchesSearch = 
                room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.roomNumber?.toString().includes(searchTerm)
            
            const matchesType = filterType === "all" || room.type === filterType
            
            return matchesSearch && matchesType
        })

        // Sort rooms
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                    return a.pricePerNight - b.pricePerNight
                case "price-desc":
                    return b.pricePerNight - a.pricePerNight
                case "name":
                    return (a.name || "").localeCompare(b.name || "")
                default:
                    return 0
            }
        })

        return filtered
    }

    const handleRoomClick = (roomId) => {
        navigate(`/room/${roomId}`)
    }

    const filteredRooms = getFilteredAndSortedRooms()
    const uniqueRoomTypes = [...new Set(rooms.map(room => room.type).filter(Boolean))]

    if (loading) {
        return (
            <>
                <Header />
                <div className="flex h-screen items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #16213e 100%)'}}>
                    <p className="text-lg" style={{color: '#ff6b6b'}}>Loading rooms...</p>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #16213e 100%)'}}>
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 haunted-title">All Rooms</h1>
                        <p className="text-sm" style={{color: '#c0c0c0', textShadow: '0 0 10px rgba(255, 107, 107, 0.3)'}}>
                            Explore our complete collection of haunted chambers
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 rounded-lg border px-4 py-3 text-sm shadow-sm flex items-center justify-between" style={{borderColor: '#ff6b6b', backgroundColor: 'rgba(139, 0, 0, 0.2)', color: '#ff6b6b'}}>
                            <span>{error} {retryCount > 0 && `(Attempt ${retryCount}/${MAX_RETRIES})`}</span>
                            <button
                                onClick={handleRetry}
                                className="ml-4 px-3 py-1 rounded text-xs font-semibold hover:bg-red-900 transition"
                                style={{backgroundColor: '#8b0000', color: '#fff'}}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Filters Section */}
                    <div className="mb-8 flex flex-col sm:flex-row gap-4 flex-wrap items-center">
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-64 px-4 py-2 rounded-lg text-sm transition"
                            style={{
                                backgroundColor: 'rgba(20, 20, 40, 0.8)',
                                border: '1px solid rgba(139, 0, 0, 0.4)',
                                color: '#c0c0c0'
                            }}
                        />

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 rounded-lg text-sm transition cursor-pointer"
                            style={{
                                backgroundColor: 'rgba(20, 20, 40, 0.8)',
                                border: '1px solid rgba(139, 0, 0, 0.4)',
                                color: '#c0c0c0'
                            }}
                        >
                            <option value="all">All Types</option>
                            {uniqueRoomTypes.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 rounded-lg text-sm transition cursor-pointer"
                            style={{
                                backgroundColor: 'rgba(20, 20, 40, 0.8)',
                                border: '1px solid rgba(139, 0, 0, 0.4)',
                                color: '#c0c0c0'
                            }}
                        >
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name">Name (A-Z)</option>
                        </select>
                    </div>

                    {/* Rooms Count */}
                    <p className="text-sm mb-6" style={{color: '#a0a0a0'}}>
                        Showing {filteredRooms.length} of {rooms.length} rooms
                    </p>

                    {/* Rooms Grid */}
                    {filteredRooms.length === 0 ? (
                        <div className="text-center py-12" style={{color: '#808080'}}>
                            <p className="text-lg">No rooms found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map(room => (
                                <div
                                    key={room._id || room.id}
                                    onClick={() => handleRoomClick(room._id || room.id)}
                                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl"
                                    style={{
                                        backgroundColor: 'rgba(20, 20, 40, 0.9)',
                                        border: '1px solid rgba(139, 0, 0, 0.4)',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-8px)"
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 0, 0, 0.3)"
                                        e.currentTarget.style.borderColor = "rgba(255, 107, 107, 0.6)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)"
                                        e.currentTarget.style.borderColor = "rgba(139, 0, 0, 0.4)"
                                    }}
                                >
                                    {/* Room Image */}
                                    {room.images && room.images.length > 0 && (
                                        <img
                                            src={room.images[0]}
                                            alt={room.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}

                                    {/* Room Info */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold mb-3" style={{color: '#e0e0e0'}}>
                                            {room.name || `Room ${room.roomNumber}`}
                                        </h3>
                                        
                                        {room.type && (
                                            <p className="text-sm mb-2 uppercase tracking-wide" style={{color: '#ff6b6b', fontSize: '11px'}}>
                                                {room.type}
                                            </p>
                                        )}

                                        {room.capacity && (
                                            <p className="text-sm mb-2" style={{color: '#a0a0a0'}}>
                                                Capacity: <span style={{color: '#c0c0c0'}}>{room.capacity} guests</span>
                                            </p>
                                        )}

                                        {room.description && (
                                            <p className="text-sm mb-4 line-clamp-2" style={{color: '#808080', lineHeight: '1.4'}}>
                                                {room.description}
                                            </p>
                                        )}

                                        <div className="border-t pt-3" style={{borderColor: 'rgba(139, 0, 0, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <span className="text-2xl font-bold" style={{color: '#ff6b6b'}}>
                                                ₱{room.pricePerNight || room.price}
                                            </span>
                                            {room.available !== false && (
                                                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50'}}>
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default Rooms
