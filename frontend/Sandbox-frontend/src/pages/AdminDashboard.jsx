import { useEffect, useState } from "react";
import axios from "axios";
import '../styles/AdminDashboard.css';


export default function AdminDashboard({ onLogout }) {
  // Summary counts and recent logs
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  // Tabs for ISOs, Images, Nodes, Logs
  const [tab, setTab] = useState("overview");

  // ISOs state
  const [isos, setIsos] = useState([]);
  const [newIsoFile, setNewIsoFile] = useState(null);
  const [isoSearch, setIsoSearch] = useState("");

  // Images state
  const [images, setImages] = useState([]);

  // Nodes state
  const [nodes, setNodes] = useState([]);

  // Selected node to see logs
  const [selectedNodeForLogs, setSelectedNodeForLogs] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("");

  // Load summary data
  const loadSummary = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admins/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load summary", err);
    }
  };

  // Load ISOs with optional search filter
  const loadISOs = async () => {
    try {
      const res = await axios.get("http://localhost:3000/isos", {
        params: { search: isoSearch },
      });
      setIsos(res.data);
    } catch (err) {
      console.error("Failed to fetch ISOs", err);
    }
  };

  // Load Images
  const loadImages = async () => {
    try {
      const res = await axios.get("http://localhost:3000/images");
      setImages(res.data);
    } catch (err) {
      console.error("Failed to fetch Images", err);
    }
  };

  // Load Nodes
  const loadNodes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/nodes");
      setNodes(res.data);
    } catch (err) {
      console.error("Failed to fetch Nodes", err);
    }
  };

  // Load Logs for a selected node
  const loadLogsForNode = async (nodeId) => {
    try {
      if (!nodeId) return;
      let url = `http://localhost:3000/logs/${nodeId}`;
      const res = await axios.get(url, { params: { search: logFilter } });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  // Effect to load summary and recent logs
  useEffect(() => {
    loadSummary();
  }, []);

  // Effect to refresh data based on selected tab
  useEffect(() => {
    if (tab === "isos") loadISOs();
    else if (tab === "images") loadImages();
    else if (tab === "nodes") loadNodes();
    else if (tab === "logs" && selectedNodeForLogs) loadLogsForNode(selectedNodeForLogs);
  }, [tab, selectedNodeForLogs]);

  // Upload ISO handler
  const handleIsoUpload = async () => {
    if (!newIsoFile) return alert("Select an ISO file first");
    const formData = new FormData();
    formData.append("iso", newIsoFile);
    try {
      await axios.post("http://localhost:3000/isos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Uploaded ISO successfully");
      setNewIsoFile(null);
      loadISOs();
      loadSummary();
    } catch (err) {
      alert("Failed to upload ISO");
      console.error(err);
    }
  };

  // Delete Image handler example
  const handleDeleteImage = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/images/${id}`);
      alert("Deleted image successfully");
      loadImages();
      loadSummary();
    } catch (err) {
      alert("Failed to delete image");
      console.error(err);
    }
  };

  // Render dashboard cards summary
  const renderSummaryCards = () => (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      <div style={cardStyle}>
        <h3>Total ISOs</h3>
        <p>{summary?.isosCount ?? "..."}</p>
      </div>
      <div style={cardStyle}>
        <h3>Total Base Images</h3>
        <p>{summary?.imagesCount ?? "..."}</p>
      </div>
      <div style={cardStyle}>
        <h3>Total Nodes</h3>
        <p>{summary?.nodesCount ?? "..."}</p>
      </div>
      <div style={cardStyle}>
        <h3>Running Overlays</h3>
        <p>{summary?.runningNodesCount ?? "..."}</p>
      </div>
      <div style={cardStyle}>
        <h3>Idle Overlays</h3>
        <p>{summary?.idleNodesCount ?? "..."}</p>
      </div>
    </div>
  );

  // Style for cards
  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "15px",
    width: "150px",
    textAlign: "center",
    backgroundColor: "#fdfdfd",
  };

  // Render ISOs table
  const renderISOs = () => (
    <div>
      <h3>ISO Management</h3>
      <input
        type="text"
        value={isoSearch}
        placeholder="Search ISOs by name"
        onChange={(e) => setIsoSearch(e.target.value)}
      />
      <button onClick={loadISOs}>Search</button>
      <br />
      <input
        type="file"
        onChange={(e) => setNewIsoFile(e.target.files[0])}
        accept=".iso"
        style={{ marginTop: "10px" }}
      />
      <button onClick={handleIsoUpload}>Upload ISO</button>

      <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: 10 }}>
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
              <td>{iso.path}</td>
              <td>{new Date(iso.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render images table with delete button and overlayCount alert
  const renderImages = () => (
    <div>
      <h3>Base Images</h3>
      <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: 10 }}>
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
              <td
                style={{
                  color: img.overlayCount > 5 ? "red" : "inherit",
                  fontWeight: img.overlayCount > 5 ? "bold" : "normal",
                }}
              >
                {img.overlayCount}
              </td>
              <td>
                <button onClick={() => handleDeleteImage(img.baseId)}>Delete</button>
                {/* Add other actions like refresh/reallocate here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render nodes table with status and VNC/Guacamole links
  const renderNodes = () => (
    <div>
      <h3>Nodes</h3>
      <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: 10 }}>
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
              <td>{node.status}</td>
              <td>{node.vncPort}</td>
              <td>{node.pid ?? "N/A"}</td>
              <td>{node.baseImage?.name || "N/A"}</td>
              <td>{new Date(node.createdAt).toLocaleString()}</td>
              <td>
                {node.gucaConnectionId ? (
                  <a
                    href={`http://localhost:8080/guacamole/#/client/${node.gucaConnectionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open VNC
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render logs for selected node
  const renderLogs = () => {
    if (!selectedNodeForLogs) return <p>Select a node to view logs</p>;
    return (
      <div>
        <h3>Logs for Node: {selectedNodeForLogs}</h3>
        <input
          placeholder="Filter logs"
          value={logFilter}
          onChange={(e) => setLogFilter(e.target.value)}
        />
        <button onClick={() => loadLogsForNode(selectedNodeForLogs)}>Refresh Logs</button>
        <ul style={{ maxHeight: 300, overflowY: "scroll", border: "1px solid #ccc" }}>
          {logs.map((log) => (
            <li key={log.id}>
              {new Date(log.createdAt).toLocaleString()}: {log.message}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("overview")}>Overview</button>
        <button onClick={() => setTab("isos")}>ISOs</button>
        <button onClick={() => setTab("images")}>Images</button>
        <button onClick={() => setTab("nodes")}>Nodes</button>
        <button onClick={() => setTab("logs")}>Logs</button>
      </nav>

      <section>
        {tab === "overview" && renderSummaryCards()}
        {tab === "isos" && renderISOs()}
        {tab === "images" && renderImages()}
        {tab === "nodes" && renderNodes()}
        {tab === "logs" && renderLogs()}
      </section>
    </div>
  );
}
