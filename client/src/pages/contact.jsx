import Header from "../components/header"
import { useState } from "react"
import axios from "axios"
import { useTheme } from "../context/ThemeContext"

function Contact() {
	const { colors } = useTheme()
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		subject: "",
		message: ""
	})
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState("")
	const [messageType, setMessageType] = useState("")
	const [expandedFAQ, setExpandedFAQ] = useState(null)

	const faqItems = [
		{
			id: 1,
			question: "How do I make a booking?",
			answer: "You can browse our available rooms on the home page, select your preferred room, and proceed to the booking page. Fill in your check-in and check-out dates, then complete the payment process."
		},
		{
			id: 2,
			question: "Can I cancel my booking?",
			answer: "Yes, cancellations can be made up to 7 days before your check-in date for a full refund. Cancellations made within 7 days may incur a cancellation fee depending on your booking terms."
		},
		{
			id: 3,
			question: "What is your cancellation policy?",
			answer: "Our cancellation policy varies by room type. Most rooms allow free cancellation up to 7 days before arrival. Please check your booking confirmation for specific terms."
		},
		{
			id: 4,
			question: "How can I modify my booking?",
			answer: "Log into your profile and view your bookings. You can change your check-in/check-out dates or room preferences if availability allows. Some changes may incur additional charges."
		},
		{
			id: 5,
			question: "What amenities are included?",
			answer: "Amenities vary by room type. Standard rooms include WiFi, TV, and AC. Premium rooms add extras like minibars, balconies, or jacuzzis. Check the room details for a complete list."
		},
		{
			id: 6,
			question: "Do you offer group bookings?",
			answer: "Yes! We accommodate group bookings. Please contact us directly for special rates and arrangements for groups."
		}
	]

	const helpCategories = [
		{ icon: "📝", title: "Make a Booking", description: "Learn how to book your stay" },
		{ icon: "❌", title: "Cancel or Change", description: "Manage your reservations" },
		{ icon: "❓", title: "FAQs", description: "Common questions answered" },
		{ icon: "👤", title: "Your Account", description: "Update your profile information" }
	]

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!formData.name || !formData.email || !formData.subject || !formData.message) {
			setMessage("Please fill in all fields")
			setMessageType("error")
			return
		}

		try {
			setLoading(true)
			const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
			const response = await axios.post(`${baseURL}/api/contact/submit`, {
				name: formData.name.trim(),
				email: formData.email.trim(),
				phone: formData.phone?.trim() || null,
				subject: formData.subject.trim(),
				message: formData.message.trim()
			})

			if (response.data.success) {
				setMessage(response.data.message || "Thank you! We'll get back to you soon.")
				setMessageType("success")
				setFormData({
					name: "",
					email: "",
					phone: "",
					subject: "",
					message: ""
				})
				setTimeout(() => setMessage(""), 3000)
			} else {
				setMessage(response.data.message || "Failed to send message")
				setMessageType("error")
			}
		} catch (error) {
			console.error("Error sending message:", error)
			setMessage(error.response?.data?.message || error.message || "Error sending message. Please try again.")
			setMessageType("error")
		} finally {
			setLoading(false)
		}
	}

	const toggleFAQ = (id) => {
		setExpandedFAQ(expandedFAQ === id ? null : id)
	}

	return (
		<>
			<Header />
			<main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #16213e 100%)'}}>
				<div className="max-w-7xl mx-auto px-4 py-8">
					{/* Hero Section */}
					<div className="mb-12 text-center">
						<h1 className="text-5xl font-bold mb-3 haunted-title">How can we help?</h1>
						<p className="text-lg haunted-subtitle">Browse common questions or contact our support team</p>
					</div>

					{/* Help Categories */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						{helpCategories.map((category, idx) => (
							<div key={idx} className="rounded-2xl border-2 p-6 cursor-pointer transition transform hover:scale-105" style={{borderColor: 'rgba(139, 0, 0, 0.6)', backgroundColor: 'rgba(20, 20, 40, 0.9)'}}>
								<div className="text-4xl mb-3">{category.icon}</div>
								<h3 style={{color: '#d0d0d0'}} className="font-bold text-lg mb-2">{category.title}</h3>
								<p style={{color: '#c0c0c0'}} className="text-sm">{category.description}</p>
							</div>
						))}
					</div>

					{/* Frequently Asked Questions */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold mb-6 haunted-title">Frequently Asked Questions</h2>
						<div className="space-y-3">
							{faqItems.map((item) => (
								<div
									key={item.id}
									className="rounded-xl border-2 overflow-hidden transition"
									style={{borderColor: 'rgba(139, 0, 0, 0.6)', backgroundColor: 'rgba(20, 20, 40, 0.9)'}}
								>
									<button
										onClick={() => toggleFAQ(item.id)}
										className="w-full px-6 py-4 text-left flex justify-between items-center hover:opacity-80 transition"
									>
										<h3 style={{color: '#d0d0d0'}} className="font-semibold text-lg">
											{item.question}
										</h3>
										<span style={{color: '#ff6b6b'}} className="text-xl font-bold">
											{expandedFAQ === item.id ? '−' : '+'}
										</span>
									</button>
									{expandedFAQ === item.id && (
										<div className="px-6 py-4 border-t" style={{borderColor: 'rgba(139, 0, 0, 0.3)'}}>
											<p style={{color: '#c0c0c0'}}>{item.answer}</p>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Contact Form Section */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold mb-6 haunted-title">Still need help?</h2>
						<div className="max-w-2xl rounded-2xl border-2 p-8" style={{borderColor: 'rgba(139, 0, 0, 0.6)', backgroundColor: 'rgba(20, 20, 40, 0.9)'}}>
							<p style={{color: '#c0c0c0'}} className="mb-6 text-sm">
								If you couldn't find the answer, please get in touch with us. Our support team will respond within 24 hours.
							</p>

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

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Full Name</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										placeholder="Your name"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Email Address</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										placeholder="your@email.com"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium uppercase tracking-wide mb-2 haunted-label">Subject</label>
									<input
										type="text"
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition haunted-input"
										placeholder="How can we help?"
									/>
								</div>

								<button
									type="submit"
									disabled={loading}
									className="w-full px-6 py-3 text-white font-semibold rounded-lg transition haunted-button disabled:opacity-50"
									style={{background: 'linear-gradient(135deg, #8b0000 0%, #660000 100%)', border: '2px solid rgba(139, 0, 0, 0.8)'}}
								>
									{loading ? "Sending..." : "Send Message"}
								</button>
							</form>
						</div>
					</div>

					{/* Contact Info Footer */}
					<div className="border-t" style={{borderColor: 'rgba(139, 0, 0, 0.3)'}} >
						<div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<p className="haunted-label text-lg mb-2">📞 Phone</p>
								<p style={{color: '#c0c0c0'}}>+1 (555) 123-4567</p>
							</div>
							<div>
								<p className="haunted-label text-lg mb-2">✉️ Email</p>
								<p style={{color: '#c0c0c0'}}>support@hotelmanagement.com</p>
							</div>
							<div>
								<p className="haunted-label text-lg mb-2">📍 Address</p>
								<p style={{color: '#c0c0c0'}}>123 Spooky Lane, Transylvania</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}

export default Contact
