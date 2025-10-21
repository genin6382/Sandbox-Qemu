"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import "../styles/AdminDashboard.css"

export default function AdminDashboard({ onLogout }) {
  // Summary counts
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Tabs for ISOs, Images, Nodes
  const [tab, setTab] = useState("overview")

  // ISOs state
  const [isos, setIsos] = useState([])
  const [newIsoFile, setNewIsoFile] = useState(null)
  const [isoSearch, setIsoSearch] = useState("")
  const [isosLoading, setIsosLoading] = useState(false)

  // Images state
  const [images, setImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(false)

  // Nodes state
  const [nodes, setNodes] = useState([])
  const [nodesLoading, setNodesLoading] = useState(false)

  // Load summary data
  const loadSummary = async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:3000/admins/summary")
      setSummary(res.data)
    } catch (err) {
      console.error("Failed to load summary", err)
    } finally {
      setLoading(false)
    }
  }

  // Load ISOs with optional search filter
  const loadISOs = async () => {
    try {
      setIsosLoading(true)
      const res = await axios.get("http://localhost:3000/isos", {
        params: { search: isoSearch },
      })
      setIsos(res.data)
    } catch (err) {
      console.error("Failed to fetch ISOs", err)
    } finally {
      setIsosLoading(false)
    }
  }

  // Load Images
  const loadImages = async () => {
    try {
      setImagesLoading(true)
      const res = await axios.get("http://localhost:3000/images")
      setImages(res.data)
    } catch (err) {
      console.error("Failed to fetch Images", err)
    } finally {
      setImagesLoading(false)
    }
  }

  // Load Nodes
  const loadNodes = async () => {
    try {
      setNodesLoading(true)
      const res = await axios.get("http://localhost:3000/nodes")
      setNodes(res.data)
    } catch (err) {
      console.error("Failed to fetch Nodes", err)
    } finally {
      setNodesLoading(false)
    }
  }

  // Effect to load summary
  useEffect(() => {
    loadSummary()
  }, [])

  // Effect to refresh data based on selected tab
  useEffect(() => {
    if (tab === "isos") loadISOs()
    else if (tab === "images") loadImages()
    else if (tab === "nodes") loadNodes()
  }, [tab])

  // Upload ISO handler
  const handleIsoUpload = async () => {
    if (!newIsoFile) return alert("Select an ISO file first")
    const formData = new FormData()
    formData.append("iso", newIsoFile)
    try {
      await axios.post("http://localhost:3000/isos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      alert("Uploaded ISO successfully")
      setNewIsoFile(null)
      loadISOs()
      loadSummary()
    } catch (err) {
      alert("Failed to upload ISO")
      console.error(err)
    }
  }

  // Delete Image handler
  const handleDeleteImage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return
    try {
      await axios.delete(`http://localhost:3000/images/${id}`)
      alert("Deleted image successfully")
      loadImages()
      loadSummary()
    } catch (err) {
      alert("Failed to delete image")
      console.error(err)
    }
  }

  const renderSummaryCards = () => (
    <div className="summary-cards">
      <div className="summary-card">
        <h3>Total ISOs</h3>
        <p>{loading ? "..." : (summary?.isosCount ?? 0)}</p>
      </div>
      <div className="summary-card">
        <h3>Total Base Images</h3>
        <p>{loading ? "..." : (summary?.imagesCount ?? 0)}</p>
      </div>
      <div className="summary-card">
        <h3>Total Nodes</h3>
        <p>{loading ? "..." : (summary?.nodesCount ?? 0)}</p>
      </div>
      <div className="summary-card">
        <h3>Running Overlays</h3>
        <p>{loading ? "..." : (summary?.runningNodesCount ?? 0)}</p>
      </div>
      <div className="summary-card">
        <h3>Idle Overlays</h3>
        <p>{loading ? "..." : (summary?.idleNodesCount ?? 0)}</p>
      </div>
    </div>
  )

  // Render ISOs table
  const renderISOs = () => (
    <div>
      <h2>ISO Management</h2>
      <div className="search-section">
        <input
          type="text"
          value={isoSearch}
          placeholder="Search ISOs by name"
          onChange={(e) => setIsoSearch(e.target.value)}
        />
        <button onClick={loadISOs} className="btn-primary" disabled={isosLoading}>
          {isosLoading ? "Searching..." : "Search"}
        </button>
      </div>
      <div className="upload-section">
        <input type="file" onChange={(e) => setNewIsoFile(e.target.files[0])} accept=".iso" />
        <button onClick={handleIsoUpload} className="btn-primary" disabled={isosLoading}>
          {isosLoading ? "Uploading..." : "Upload ISO"}
        </button>
      </div>

      {isosLoading ? (
        <div className="loading-state">Loading ISOs...</div>
      ) : isos.length === 0 ? (
        <div className="empty-state">No ISOs found. Upload one to get started.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th>Upload Date</th>
            </tr>
          </thead>
          <tbody>
            {isos.map((iso) => (
              <tr key={iso.isoId}>
                <td>{iso.name}</td>
                <td className="text-monospace">{iso.path}</td>
                <td>{new Date(iso.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  // Render images table with delete button
  const renderImages = () => (
    <div>
      <h2>Base Images</h2>
      {imagesLoading ? (
        <div className="loading-state">Loading images...</div>
      ) : images.length === 0 ? (
        <div className="empty-state">No base images available.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>ISO</th>
              <th>Size (MB)</th>
              <th>Overlay Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {images.map((img) => (
              <tr key={img.baseId}>
                <td>{img.name}</td>
                <td>{img.iso?.name || "N/A"}</td>
                <td>{img.size}</td>
                <td className={img.overlayCount > 5 ? "highlight-warning" : ""}>{img.overlayCount}</td>
                <td>
                  <button onClick={() => handleDeleteImage(img.baseId)} className="btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  // Render nodes table with status and VNC/Guacamole links
  const renderNodes = () => (
    <div>
      <h2>Nodes</h2>
      {nodesLoading ? (
        <div className="loading-state">Loading nodes...</div>
      ) : nodes.length === 0 ? (
        <div className="empty-state">No nodes available.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>VNC Port</th>
              <th>PID</th>
              <th>Base Image</th>
              <th>Created</th>
              <th>VNC Connection</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id}>
                <td>{node.name}</td>
                <td>
                  <span className={`status-badge status-${node.status.toLowerCase()}`}>{node.status}</span>
                </td>
                <td>{node.vncPort}</td>
                <td className="text-monospace">{node.pid ?? "N/A"}</td>
                <td>{node.baseImage?.name || "N/A"}</td>
                <td>{new Date(node.createdAt).toLocaleString()}</td>
                <td>
                  {node.gucaConnectionId ? (
                    <a
                      href={`http://localhost:8080/guacamole/#/client/${node.gucaConnectionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-primary"
                    >
                      Open VNC
                    </a>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button onClick={() => setTab("overview")} className={`nav-btn ${tab === "overview" ? "active" : ""}`}>
          Overview
        </button>
        <button onClick={() => setTab("isos")} className={`nav-btn ${tab === "isos" ? "active" : ""}`}>
          ISOs
        </button>
        <button onClick={() => setTab("images")} className={`nav-btn ${tab === "images" ? "active" : ""}`}>
          Images
        </button>
        <button onClick={() => setTab("nodes")} className={`nav-btn ${tab === "nodes" ? "active" : ""}`}>
          Nodes
        </button>
      </nav>

      <div className="dashboard-content-wrapper">
        <section className="dashboard-section">
          {tab === "overview" && renderSummaryCards()}
          {tab === "isos" && renderISOs()}
          {tab === "images" && renderImages()}
          {tab === "nodes" && renderNodes()}
        </section>
      </div>
    </div>
  )
}
