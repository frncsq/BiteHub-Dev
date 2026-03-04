import Header from "../components/header"
import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { mockProfileService, mockAuthService } from "../services/mockData"

function Profile() {
	const { colors } = useTheme()
	const [profile, setProfile] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		city: "",
		country: "",
		joinDate: ""
	})
	const [editMode, setEditMode] = useState(false)
	const [formData, setFormData] = useState(profile)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState("")
	const [messageType, setMessageType] = useState("")

	useEffect(() => {
		fetchProfile()
	}, [])

	const fetchProfile = async () => {
		try {
			setLoading(true)
			// Get user from mock auth service
			const user = mockAuthService.getCurrentUser()
			if (user) {
				const profileData = {
					name: user.fullName || user.name || 'Demo User',
					email: user.email,
					phone: "+1 234 567 8900",
					address: "123 Main Street",
					city: "Sample City",
					country: "USA",
					joinDate: new Date().toLocaleDateString()
				}
				setProfile(profileData)
				setFormData(profileData)
			}
		} catch (error) {
			console.error("Error fetching profile:", error)
			setMessage("Failed to load profile")
			setMessageType("error")
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSave = async () => {
		try {
			setSaving(true)
			const response = await axios.put(`${API_URL}/profile`, formData, {
				headers: { Authorization: `Bearer ${token}` }
			})

			if (response.data.success) {
				setProfile(formData)
				setEditMode(false)
				setMessage("Profile updated successfully!")
				setMessageType("success")
				setTimeout(() => setMessage(""), 3000)
			}
		} catch (error) {
			console.error("Error updating profile:", error)
			setMessage("Failed to update profile")
			setMessageType("error")
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		setEditMode(false)
		setFormData(profile)
		setMessage("")
	}

	if (loading) {
		return (
			<>
				<Header />
				<div className="flex h-screen items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #16213e 100%)'}}>
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-12 w-12 mb-4 border-4" style={{borderColor: 'rgba(139, 0, 0, 0.3)', borderTopColor: '#ff6b6b'}}></div>
						<p style={{color: '#c0c0c0'}}>Loading profile...</p>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header />
			<main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #16213e 100%)'}}>
				<div className="max-w-3xl mx-auto px-4 py-8">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-4xl font-bold mb-2 haunted-title">My Profile</h1>
						<p className="text-sm haunted-subtitle">
							Manage your account information
						</p>
					</div>

					{/* Message */}
					{message && (
						<div className={`mb-6 rounded-lg border px-4 py-3 text-sm shadow-sm flex items-center justify-between ${
							messageType === 'success' 
								? 'border-green-600 bg-green-900/20 text-green-400' 
								: 'border-red-600 bg-red-900/20 text-red-400'
						}`} style={messageType === 'error' ? {borderColor: '#ff6b6b', backgroundColor: 'rgba(139, 0, 0, 0.2)', color: '#ff6b6b'} : {}}>
							<span>{message}</span>
							<button
								onClick={() => setMessage("")}
								className="ml-4 text-lg hover:opacity-70"
							>
								✕
							</button>
						</div>
					)}

					{/* Profile Card */}
					<div className="rounded-2xl border-2 p-6 md:p-8 shadow-md haunted-card" style={{borderColor: 'rgba(139, 0, 0, 0.6)', backgroundColor: 'rgba(20, 20, 40, 0.9)'}}>
						{/* Profile Header with Avatar */}
						<div className="mb-8 pb-8 border-b" style={{borderColor: 'rgba(139, 0, 0, 0.3)'}}>
							<div className="flex items-center">
								<div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold" style={{background: 'linear-gradient(135deg, #8b0000 0%, #660000 100%)', boxShadow: '0 0 20px rgba(139, 0, 0, 0.6)'}}>
									{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
								</div>
								<div className="ml-6">
									<h2 className="text-2xl font-bold" style={{color: '#d0d0d0'}}>{profile.name || "No name"}</h2>
									<p style={{color: '#c0c0c0'}}>{profile.email || "No email"}</p>
									<p className="text-sm mt-1" style={{color: '#8b8b8b'}}>Member since {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "Unknown"}</p>
								</div>
							</div>
						</div>

						{/* Edit Button */}
						<div className="mb-8 flex gap-3">
							<button
								onClick={() => editMode ? handleSave() : setEditMode(true)}
								className="px-6 py-2 text-white font-semibold rounded-lg transition haunted-button"
								style={{background: 'linear-gradient(135deg, #8b0000 0%, #660000 100%)', border: '2px solid rgba(139, 0, 0, 0.8)'}}
							>
								{editMode ? (saving ? "Saving..." : "Save Changes") : "Edit Profile"}
							</button>
							{editMode && (
								<button
									onClick={handleCancel}
									className="px-6 py-2 font-semibold rounded-lg transition"
									style={{backgroundColor: 'rgba(100, 100, 100, 0.3)', color: '#c0c0c0', border: '2px solid rgba(139, 0, 0, 0.4)'}}
									onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 100, 100, 0.5)'}
									onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(100, 100, 100, 0.3)'}
								>
									Cancel
								</button>
							)}
						</div>

						{/* Form Fields */}
						<div className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								{/* Full Name */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Full Name</label>
									{editMode ? (
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.name || "Not provided"}</p>
									)}
								</div>

								{/* Email */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Email Address</label>
									{editMode ? (
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.email || "Not provided"}</p>
									)}
								</div>

								{/* Phone */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Phone Number</label>
									{editMode ? (
										<input
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.phone || "Not provided"}</p>
									)}
								</div>

								{/* City */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">City</label>
									{editMode ? (
										<input
											type="text"
											name="city"
											value={formData.city}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.city || "Not provided"}</p>
									)}
								</div>

								{/* Country */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Country</label>
									{editMode ? (
										<input
											type="text"
											name="country"
											value={formData.country}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.country || "Not provided"}</p>
									)}
								</div>

								{/* Address */}
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Address</label>
									{editMode ? (
										<input
											type="text"
											name="address"
											value={formData.address}
											onChange={handleChange}
											className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										/>
									) : (
										<p style={{color: '#d0d0d0'}}>{profile.address || "Not provided"}</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}

export default Profile
