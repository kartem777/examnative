import React, { useState, useEffect } from "react";
import { SafeAreaView, FlatList, View } from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  FAB,
  TextInput,
  Button,
  Card,
  Chip,
  Dialog,
  Portal,
  Paragraph,
  RadioButton,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Helper functions ---
const isToday = (date) => {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

const isThisWeek = (date) => {
  const d = new Date(date);
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return d >= start && d <= end;
};

const isThisMonth = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

// --- Main App ---
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState("home"); // home | add | search | projects

  // form state for Add
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedProject, setSelectedProject] = useState(null);

  // edit dialog state
  const [editingTask, setEditingTask] = useState(null);

  // search/filter
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | today | week | month

  // project form
  const [projectName, setProjectName] = useState("");

  // load data
  useEffect(() => {
    (async () => {
      const storedTasks = await AsyncStorage.getItem("tasks");
      const storedProjects = await AsyncStorage.getItem("projects");
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedProjects) setProjects(JSON.parse(storedProjects));
    })();
  }, []);

  // save helpers
  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
  };

  const saveProjects = async (newProjects) => {
    setProjects(newProjects);
    await AsyncStorage.setItem("projects", JSON.stringify(newProjects));
  };

  // CRUD
  const addTask = () => {
    if (!title.trim()) return;
    const newTask = {
      id: Date.now(),
      title,
      desc,
      tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
      priority,
      date,
      project: selectedProject,
    };
    saveTasks([...tasks, newTask]);
    resetForm();
    setScreen("home");
  };

  const deleteTask = (id) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const updateTask = () => {
    const updated = tasks.map((t) =>
      t.id === editingTask.id ? editingTask : t
    );
    saveTasks(updated);
    setEditingTask(null);
  };

  const addProject = () => {
    if (!projectName.trim()) return;
    const newProject = { id: Date.now(), name: projectName };
    saveProjects([...projects, newProject]);
    setProjectName("");
  };

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setTags("");
    setPriority("Medium");
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedProject(null);
  };

  // filtering
  const applyFilter = (list) => {
    if (filter === "today") return list.filter((t) => isToday(t.date));
    if (filter === "week") return list.filter((t) => isThisWeek(t.date));
    if (filter === "month") return list.filter((t) => isThisMonth(t.date));
    return list;
  };

  const filteredTasks = applyFilter(
    tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.desc.toLowerCase().includes(query.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
        t.priority.toLowerCase().includes(query.toLowerCase())
    )
  );

  // --- UI screens ---
  const renderHome = () => (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={applyFilter(tasks)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ margin: 8 }}>
            <Card.Title
              title={item.title}
              subtitle={`${item.priority} • ${item.date}${
                item.project ? " • " + projects.find((p) => p.id === item.project)?.name : ""
              }`}
              right={() => (
                <View style={{ flexDirection: "row" }}>
                  <Button onPress={() => setEditingTask(item)}>Edit</Button>
                  <Button onPress={() => deleteTask(item.id)} color="red">
                    Delete
                  </Button>
                </View>
              )}
            />
            <Card.Content>
              <Paragraph>{item.desc}</Paragraph>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {item.tags.map((tag, idx) => (
                  <Chip key={idx} style={{ margin: 2 }}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        style={{ position: "absolute", right: 16, bottom: 16 }}
        icon="plus"
        onPress={() => setScreen("add")}
      />

      {/* Edit dialog inside Home */}
      <Portal>
        <Dialog visible={!!editingTask} onDismiss={() => setEditingTask(null)}>
          <Dialog.Title>Edit Task</Dialog.Title>
          <Dialog.Content>
            {editingTask && (
              <>
                <TextInput
                  label="Title"
                  value={editingTask.title}
                  onChangeText={(v) => setEditingTask({ ...editingTask, title: v })}
                />
                <TextInput
                  label="Description"
                  value={editingTask.desc}
                  onChangeText={(v) => setEditingTask({ ...editingTask, desc: v })}
                />
                <TextInput
                  label="Tags"
                  value={editingTask.tags.join(",")}
                  onChangeText={(v) =>
                    setEditingTask({
                      ...editingTask,
                      tags: v.split(",").map((t) => t.trim()),
                    })
                  }
                />
                <TextInput
                  label="Priority"
                  value={editingTask.priority}
                  onChangeText={(v) => setEditingTask({ ...editingTask, priority: v })}
                />
                <TextInput
                  label="Date"
                  value={editingTask.date}
                  onChangeText={(v) => setEditingTask({ ...editingTask, date: v })}
                />
                <TextInput
                  label="Project ID"
                  value={editingTask.project ? editingTask.project.toString() : ""}
                  onChangeText={(v) =>
                    setEditingTask({ ...editingTask, project: v ? parseInt(v) : null })
                  }
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditingTask(null)}>Cancel</Button>
            <Button onPress={updateTask}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );

  const renderAdd = () => (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput label="Title" value={title} onChangeText={setTitle} style={{ marginBottom: 10 }} />
      <TextInput label="Description" value={desc} onChangeText={setDesc} style={{ marginBottom: 10 }} />
      <TextInput label="Tags (comma separated)" value={tags} onChangeText={setTags} style={{ marginBottom: 10 }} />
      <TextInput label="Priority" value={priority} onChangeText={setPriority} style={{ marginBottom: 10 }} />
      <TextInput label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={{ marginBottom: 10 }} />
      <TextInput
        label="Project ID (optional)"
        value={selectedProject ? selectedProject.toString() : ""}
        onChangeText={(v) => setSelectedProject(v ? parseInt(v) : null)}
        style={{ marginBottom: 10 }}
      />
      <Button mode="contained" onPress={addTask}>
        Save Task
      </Button>
      <Button onPress={resetForm}>Cancel</Button>
    </SafeAreaView>
  );

  const renderSearch = () => (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput label="Search" value={query} onChangeText={setQuery} style={{ marginBottom: 10 }} />
      <RadioButton.Group onValueChange={setFilter} value={filter}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <RadioButton.Item label="All" value="all" />
          <RadioButton.Item label="Today" value="today" />
          <RadioButton.Item label="Week" value="week" />
          <RadioButton.Item label="Month" value="month" />
        </View>
      </RadioButton.Group>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ margin: 8 }}>
            <Card.Title title={item.title} subtitle={item.priority} />
          </Card>
        )}
      />
    </SafeAreaView>
  );

  const renderProjects = () => (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput label="New Project Name" value={projectName} onChangeText={setProjectName} />
      <Button onPress={addProject}>Add Project</Button>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ margin: 8 }}>
            <Card.Title title={item.name} subtitle={`ID: ${item.id}`} />
          </Card>
        )}
      />
    </SafeAreaView>
  );

  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="To-Do App" />
          <Appbar.Action icon="home" onPress={() => setScreen("home")} />
          <Appbar.Action icon="magnify" onPress={() => setScreen("search")} />
          <Appbar.Action icon="folder" onPress={() => setScreen("projects")} />
        </Appbar.Header>
        {screen === "home" && renderHome()}
        {screen === "add" && renderAdd()}
        {screen === "search" && renderSearch()}
        {screen === "projects" && renderProjects()}
      </SafeAreaView>
    </PaperProvider>
  );
}
