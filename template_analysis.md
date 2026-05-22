# Template Analysis: AI_REPORT_FINAL.docx

- Efficient Route Optimization Using Classical Pathfinding Algorithms
- Faculty : DR.SUSMI JACOB
- Presented by

## R NIHARIKA – AP23110011226 (Style: Normal)

## SK.SADIYA PARVIN -AP23110011235 (Style: Normal)

## S.BHAVYA -AP23110011222 (Style: Normal)

## LIKITH – AP23110011221 (Style: Normal)
- 1. Introduction

[Long Paragraph - ~414 chars]
- 2. Background Study

[Long Paragraph - ~245 chars]
- 3. Problem Statement

[Long Paragraph - ~276 chars]
- 4. Proposed System
- The system is a visual tool that allows users to select start and end points on a map and observe how algorithms find paths. It uses real-world map data and displays step-by-step execution.
- 5. Algorithms Involved
- 5.1 Dijkstra’s Algorithm
- Theory

[Long Paragraph - ~269 chars]

[Long Paragraph - ~297 chars]
- Algorithm Steps
- Initialize all nodes with distance = ∞, except the start node (distance = 0).
- Mark all nodes as unvisited.
- Add the start node to the open list.
- Select the node with the smallest distance.
- For each neighbor of the current node:
- Calculate new distance = current distance + edge weight
- If new distance is smaller, update the neighbor’s distance
- Mark the current node as visited.
- Repeat steps until the destination node is reached or all nodes are visited.
- Pseudocode
- Time Complexity
- Using simple array: O(V²)
- Using priority queue (heap): O(E log V)
- Where:
- V = number of vertices
- E = number of edges
- Space Complexity
- O(V)
Used for storing distances, visited nodes, and parent references.
- Optimality
- Dijkstra’s Algorithm always finds the shortest path as long as all edge weights are            non-negative.
- Completeness
- The algorithm guarantees finding a solution if a path exists between the start and destination nodes.
- 5.2    A* (A-Star) Algorithm
- Theory

[Long Paragraph - ~220 chars]
- A* evaluates each node using the function:
- Where:
- = actual cost from start to node
- = estimated cost from node to goal
- Algorithm Steps
- Initialize the start node with:
- Add the start node to the open list.
- Select the node with the lowest value.
- If the selected node is the goal, stop.
- Move the node to the closed list.
- For each neighbor:
- Calculate and
- Compute
- If a better path is found, update values
- Repeat until the goal is reached.
- Pseudocode
- Time Complexity
- O(E log V) (using priority queue)
- Where:
- V = number of vertices
- E = number of edges
- Space Complexity
- O(V)
Stores open list, closed list, and cost values.
- Optimality
- A* guarantees the shortest path if the heuristic is admissible and consistent (never overestimates).
- Completeness
- A* always finds a solution if a path exists.
- 5.3  Greedy Best-First Search (GBFS)
- Theory

[Long Paragraph - ~270 chars]
- The algorithm uses a heuristic function , usually the straight-line (Euclidean) distance to the goal:
- GBFS is effective when speed is more important than path optimality, such as in real-time applications or AI agents in games.
- Algorithm Steps
- Initialize the start node and compute its heuristic .
- Add the start node to the open list.
- While the open list is not empty:
- Select the node with the smallest heuristic value .
- If this node is the goal, stop.
- Move the node to the visited list.
- For each neighbor:
- Calculate
- If the neighbor is unvisited, add it to the open list.
- Repeat until the goal is reached or the open list is empty.
- Pseudocode
- Time Complexity
- O(E) in practice (depends on graph density)
- Very fast because it ignores path cost and explores fewer nodes
- Space Complexity
- O(V)
Stores open list and visited nodes
- Optimality
- Not guaranteed
Since it ignores the path cost from start, GBFS may produce longer paths or fail in complex mazes.
- Completeness
- Usually complete
It can find a path if one exists, but may require backtracking in obstructed environments.
- 5.4 Bidirectional Search
- Theory

[Long Paragraph - ~228 chars]
- Forward Search: From the start node
- Backward Search: From the goal node

[Long Paragraph - ~207 chars]
- Algorithm Steps
- Initialize two open sets:
- openSetStart with the start node
- openSetGoal with the goal node
- Initialize two closed sets to track visited nodes.
- Repeat until a common node is found or both open sets are empty:
- Expand a node from the forward search
- Expand a node from the backward search
- If a node appears in both closed sets, the searches have met
- Reconstruct the path by connecting the forward and backward paths through the meeting node.
- Stop once the full path from start to goal is found.
- Pseudocode
- Time Complexity
- O(b^(d/2))
Where b = branching factor, d = depth of the solution
- Much faster than single-direction search (O(b^d))
- Space Complexity
- O(V)
Maintains two sets of open and closed nodes
- Optimality
- Optimal
   Bidirectional Search finds the shortest path when both searches are uniform.
- Completeness
- Complete
  It guarantees a solution if a path exists between start and goal.
- Algorithm Comparison

## 7 OUTPUT IMAGES (Style: Normal)
- 7.1 Dijikstra
- 7.2 Greedy BFS
- 7.3 A*(A-Start)
- 7.4 Bidirectional

## 8 . CONCLUSION (Style: Normal)

[Long Paragraph - ~637 chars]


## Potential Diagrams/Images
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
- Image found: WD_INLINE_SHAPE_TYPE.PICTURE
