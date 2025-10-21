import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/GuestDashboard.css";
import pcIcon from "../assets/pc.png";


/**Guest Dashboard 
 * Displays the list of available isos 
 * Can START/STOP/WIPE a VM
 * View logs of a created VM
 */
export default function GuestDashboard({ onLogout }) {
  const [isos, setIsos] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [pollingNodeId, setPollingNodeId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  const loadNodeLogs = async (nodeId) => {
    try {
      setLoadingLogs(true);
      const res = await axios.get(`http://localhost:3000/logs/${nodeId}`);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load logs", err);
      alert("Failed to load logs");
    } finally {
      setLoadingLogs(false);
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
    const datasource = 'mysql';
    const connectionString = `${connectionId}\x00c\x00${datasource}`;
    const encodedString = btoa(connectionString);
    return `http://localhost:8080/guacamole/#/client/${encodedString}`;
  };

  const handleNodeClick = (node, e) => {
    if (e.target.closest('.node-menu-btn')) return;
    
    if (node.status === "RUNNING" && node.gucaConnectionId) {
      const guacUrl = node.guacamoleUrl || generateGuacamoleURL(node.gucaConnectionId);
      console.log('Opening Guacamole URL:', guacUrl);
      window.open(guacUrl, `_blank_${node.id}`);
    } else {
      setSelectedNode(node);
      setShowControls(true);
    }
  };

  const toggleMenu = (nodeId, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === nodeId ? null : nodeId);
  };

  const viewLogs = async (node) => {
    setShowMenu(null);
    setSelectedNode(node);
    setShowLogs(true);
    await loadNodeLogs(node.id);
  };

  const startNode = async (node) => {
    if (!node) return;
    try {
      setLoadingActions({ [node.id]: "starting" });
      setShowControls(false);
      
      await axios.post(`http://localhost:3000/nodes/${node.id}/run`);
      
      setPollingNodeId(node.id);
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
          setPollingNodeId(null);
          setLoadingActions({});
          alert(`VM "${pollingNode.name}" is now running! Click to open.`);
        }
      } catch (err) {
        console.error("Failed to poll nodes", err);
      }
    }, 2000);

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
                    <button onClick={() => viewLogs(node)}>
                      View Logs
                    </button>
                    <button onClick={() => wipeNode(node)} className="danger">
                      Wipe VM
                    </button>
                  </div>
                )}

                <img src={pcIcon} alt="PC" className="node-pc-icon" />
                <p className="node-name">{node.name}</p>
                <p className="node-iso">{node.baseImage?.iso?.name || 'Unknown ISO'}</p>
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
            <p className="modal-iso-info">ISO: {selectedNode.baseImage?.iso?.name}</p>
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

      {/* Logs Modal */}
      {showLogs && selectedNode && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="logs-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Logs: {selectedNode.name}</h3>
            <p className="modal-iso-info">ISO: {selectedNode.baseImage?.iso?.name}</p>
            
            {loadingLogs ? (
              <div className="logs-loading">Loading logs...</div>
            ) : (
              <div className="logs-container">
                {logs.length === 0 ? (
                  <p className="no-logs">No logs available</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-timestamp">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            
            <div className="modal-buttons">
              <button onClick={() => loadNodeLogs(selectedNode.id)}>
                Refresh Logs
              </button>
              <button onClick={() => setShowLogs(false)} className="cancel-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}