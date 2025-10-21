import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/GuestDashboard.css";
import pcIcon from "../assets/pc.png";

export default function GuestDashboard({ onLogout }) {
  const [isos, setIsos] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [pollingNodeId, setPollingNodeId] = useState(null);

  const loadISOs = async () => {
    try {
      const res = await axios.get("http://localhost:3000/isos");
      setIsos(res.data);
    } catch (err) {
      console.error("Failed to load ISOs", err);
    }
  };

  const loadNodes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/nodes");
      const nodesData = res.data.nodes || res.data;
      setNodes(Array.isArray(nodesData) ? nodesData : []);
    } catch (err) {
      console.error("Failed to load nodes", err);
    }
  };

  const handleIsoClick = async (iso) => {
    const nodeName = prompt(`Enter a name for your VM (ISO: ${iso.name})`);
    if (!nodeName || !nodeName.trim()) return;

    try {
      setLoadingActions({ [iso.isoId]: true });
      await axios.post("http://localhost:3000/nodes", {
        name: nodeName.trim(),
        isoId: iso.isoId,
      });
      alert("VM created successfully!");
      loadNodes();
    } catch (err) {
      alert("Failed to create VM");
      console.error(err);
    } finally {
      setLoadingActions({});
    }
  };

  const generateGuacamoleURL = (connectionId) => {
    // This must match your backend's generateConnectionURL function
    const datasource = 'mysql'; // or whatever your GUACAMOLE_DATASOURCE is
    const connectionString = `${connectionId}\x00c\x00${datasource}`;
    const encodedString = btoa(connectionString);
    return `http://localhost:8080/guacamole/#/client/${encodedString}`;
  };

  const handleNodeClick = (node, e) => {
    // Don't open if clicking on the menu button
    if (e.target.closest('.node-menu-btn')) return;
    
    if (node.status === "RUNNING" && node.gucaConnectionId) {
      // Generate properly encoded Guacamole URL
      const guacUrl = node.guacamoleUrl || generateGuacamoleURL(node.gucaConnectionId);
      console.log('Opening Guacamole URL:', guacUrl);
      
      // Open in new tab for multiple VMs
      window.open(guacUrl, `_blank_${node.id}`);
    } else {
      // Show controls modal for non-running nodes
      setSelectedNode(node);
      setShowControls(true);
    }
  };

  const toggleMenu = (nodeId, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === nodeId ? null : nodeId);
  };

  const startNode = async (node) => {
    if (!node) return;
    try {
      setLoadingActions({ [node.id]: "starting" });
      setShowControls(false);
      
      await axios.post(`http://localhost:3000/nodes/${node.id}/run`);
      
      // Start polling to check when VM is truly ready
      setPollingNodeId(node.id);
      
      // Initial reload after a short delay
      setTimeout(() => loadNodes(), 1000);
      
      setSelectedNode(null);
    } catch (err) {
      alert("Failed to start VM: " + (err.response?.data?.message || err.message));
      console.error(err);
      setLoadingActions({});
    }
  };

  const stopNode = async (node) => {
    if (!node) return;
    setShowMenu(null);
    try {
      setLoadingActions({ [node.id]: "stopping" });
      await axios.post(`http://localhost:3000/nodes/${node.id}/stop`);
      await loadNodes();
    } catch (err) {
      alert("Failed to stop VM");
      console.error(err);
    } finally {
      setLoadingActions({});
    }
  };

  const wipeNode = async (node) => {
    if (!node) return;
    if (!window.confirm(`Are you sure you want to wipe "${node.name}"?`)) return;

    setShowMenu(null);
    setShowControls(false);
    try {
      setLoadingActions({ [node.id]: "wiping" });
      await axios.post(`http://localhost:3000/nodes/${node.id}/wipe`);
      await loadNodes();
      setSelectedNode(null);
    } catch (err) {
      alert("Failed to wipe VM");
      console.error(err);
    } finally {
      setLoadingActions({});
    }
  };

  // Poll for node status updates when starting a VM
  useEffect(() => {
    if (!pollingNodeId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:3000/nodes");
        const nodesData = res.data.nodes || res.data;
        const updatedNodes = Array.isArray(nodesData) ? nodesData : [];
        
        setNodes(updatedNodes);
        
        const pollingNode = updatedNodes.find(n => n.id === pollingNodeId);
        
        if (pollingNode && pollingNode.status === "RUNNING") {
          // VM is now running, stop polling
          setPollingNodeId(null);
          setLoadingActions({});
          
          // Show success message
          alert(`VM "${pollingNode.name}" is now running! Click to open.`);
        }
      } catch (err) {
        console.error("Failed to poll nodes", err);
      }
    }, 2000); // Poll every 2 seconds

    // Clear polling after 30 seconds as a safety measure
    const timeout = setTimeout(() => {
      setPollingNodeId(null);
      setLoadingActions({});
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [pollingNodeId]);

  useEffect(() => {
    loadISOs();
    loadNodes();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(null);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className="guest-dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Available PCs</h2>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
        <div className="iso-list">
          {isos.map((iso) => (
            <div
              key={iso.isoId}
              className="iso-item"
              onClick={() => handleIsoClick(iso)}
            >
              <img src={pcIcon} alt="PC" className="sidebar-pc-icon" />
              <p>{iso.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main workspace */}
      <div className="workspace">
        {!Array.isArray(nodes) || nodes.length === 0 ? (
          <div className="empty-state">
            <p>Click on a PC from the sidebar to create a VM</p>
          </div>
        ) : (
          <div className="nodes-grid">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`node-card ${node.status.toLowerCase()}`}
                onClick={(e) => handleNodeClick(node, e)}
              >
                {/* Three dots menu */}
                <div className="node-menu-btn" onClick={(e) => toggleMenu(node.id, e)}>
                  ⋮
                </div>
                
                {showMenu === node.id && (
                  <div className="node-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    {node.status === "RUNNING" && (
                      <button onClick={() => stopNode(node)}>
                        Stop VM
                      </button>
                    )}
                    <button onClick={() => wipeNode(node)} className="danger">
                      Wipe VM
                    </button>
                  </div>
                )}

                <img src={pcIcon} alt="PC" className="node-pc-icon" />
                <p className="node-name">{node.name}</p>
                <span className={`node-status status-${node.status.toLowerCase()}`}>
                  {node.status}
                </span>
                
                {loadingActions[node.id] && (
                  <div className="loading-overlay">
                    {loadingActions[node.id]}...
                  </div>
                )}
                
                {pollingNodeId === node.id && (
                  <div className="loading-overlay">
                    Starting VM...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Modal for non-running nodes */}
      {showControls && selectedNode && (
        <div className="modal-overlay" onClick={() => setShowControls(false)}>
          <div className="control-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Control VM: {selectedNode.name}</h3>
            <p>
              Status:{" "}
              <span className={`status status-${selectedNode.status.toLowerCase()}`}>
                {selectedNode.status}
              </span>
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => startNode(selectedNode)}
                disabled={loadingActions[selectedNode.id] === "starting"}
              >
                {loadingActions[selectedNode.id] === "starting"
                  ? "Starting..."
                  : "Start VM"}
              </button>
              <button
                onClick={() => wipeNode(selectedNode)}
                disabled={loadingActions[selectedNode.id] === "wiping"}
                className="wipe-btn"
              >
                {loadingActions[selectedNode.id] === "wiping" ? "Wiping..." : "Wipe VM"}
              </button>
              <button onClick={() => setShowControls(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}