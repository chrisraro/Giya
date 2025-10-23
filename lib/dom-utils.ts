// lib/dom-utils.ts
// Utility functions for safe DOM operations

/**
 * Safely removes a child node from its parent
 * @param child The child node to remove
 */
export function safeRemoveChild(child: Node | null): boolean {
  if (!child || !child.parentNode) {
    return false;
  }
  
  try {
    // Check if the child is actually a child of the parent before removing
    if (child.parentNode.contains(child)) {
      child.parentNode.removeChild(child);
      return true;
    } else {
      console.warn("Child node is not actually a child of the parent");
      return false;
    }
  } catch (error) {
    console.warn("Failed to remove child node:", error);
    return false;
  }
}

/**
 * Safely appends a child node to a parent
 * @param parent The parent node
 * @param child The child node to append
 */
export function safeAppendChild(parent: Node, child: Node): boolean {
  try {
    parent.appendChild(child);
    return true;
  } catch (error) {
    console.warn("Failed to append child node:", error);
    return false;
  }
}

/**
 * Checks if a node is still connected to the DOM
 * @param node The node to check
 */
export function isNodeConnected(node: Node): boolean {
  return node.isConnected !== undefined ? node.isConnected : document.contains(node);
}

/**
 * Safely replaces a child node with another node
 * @param parent The parent node
 * @param newChild The new child node
 * @param oldChild The old child node to replace
 */
export function safeReplaceChild(parent: Node, newChild: Node, oldChild: Node): boolean {
  if (!parent.contains(oldChild)) {
    console.warn("Old child is not a child of the parent");
    return false;
  }
  
  try {
    parent.replaceChild(newChild, oldChild);
    return true;
  } catch (error) {
    console.warn("Failed to replace child node:", error);
    return false;
  }
}

/**
 * Safely removes all child nodes from a parent
 * @param parent The parent node
 */
export function safeRemoveAllChildren(parent: Node): void {
  try {
    while (parent.firstChild) {
      safeRemoveChild(parent.firstChild);
    }
  } catch (error) {
    console.warn("Failed to remove all children:", error);
  }
}