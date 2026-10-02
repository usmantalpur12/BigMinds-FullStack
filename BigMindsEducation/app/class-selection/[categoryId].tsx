import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Category data mapping
const categoryData = {
  "pre-engineering": {
    name: "Pre-Engineering",
    icon: "🔧",
    description: "Engineering preparation courses for FSc students",
    color: "#4F46E5",
    classes: [
      { id: "9", name: "Class 9", description: "9th grade engineering preparation", subjects: ["Physics", "Chemistry", "Mathematics"] },
      { id: "10", name: "Class 10", description: "10th grade engineering preparation", subjects: ["Physics", "Chemistry", "Mathematics"] },
      { id: "11", name: "Class 11", description: "11th grade engineering preparation", subjects: ["Physics", "Chemistry", "Mathematics"] },
      { id: "12", name: "Class 12", description: "12th grade engineering preparation", subjects: ["Physics", "Chemistry", "Mathematics"] }
    ]
  },
  "pre-medical": {
    name: "Pre-Medical",
    icon: "🏥",
    description: "Medical preparation courses for FSc students",
    color: "#DC2626",
    classes: [
      { id: "9", name: "Class 9", description: "9th grade medical preparation", subjects: ["Biology", "Chemistry", "Physics"] },
      { id: "10", name: "Class 10", description: "10th grade medical preparation", subjects: ["Biology", "Chemistry", "Physics"] },
      { id: "11", name: "Class 11", description: "11th grade medical preparation", subjects: ["Biology", "Chemistry", "Physics"] },
      { id: "12", name: "Class 12", description: "12th grade medical preparation", subjects: ["Biology", "Chemistry", "Physics"] }
    ]
  },
  "computer-science": {
    name: "Computer Science",
    icon: "💻",
    description: "Computer science and programming courses",
    color: "#059669",
    classes: [
      { id: "9", name: "Class 9", description: "9th grade computer science", subjects: ["Programming", "Web Development", "Database"] },
      { id: "10", name: "Class 10", description: "10th grade computer science", subjects: ["Programming", "Web Development", "Database"] },
      { id: "11", name: "Class 11", description: "11th grade computer science", subjects: ["Programming", "Web Development", "Database"] },
      { id: "12", name: "Class 12", description: "12th grade computer science", subjects: ["Programming", "Web Development", "Database"] }
    ]
  },
  "bba": {
    name: "BBA",
    icon: "💼",
    description: "Business administration and management courses",
    color: "#D97706",
    classes: [
      { id: "9", name: "Class 9", description: "9th grade business administration", subjects: ["Business Math", "Economics", "Management"] },
      { id: "10", name: "Class 10", description: "10th grade business administration", subjects: ["Business Math", "Economics", "Management"] },
      { id: "11", name: "Class 11", description: "11th grade business administration", subjects: ["Business Math", "Economics", "Management"] },
      { id: "12", name: "Class 12", description: "12th grade business administration", subjects: ["Business Math", "Economics", "Management"] }
    ]
  },
  "o-levels": {
    name: "O Levels",
    icon: "📚",
    description: "O Level preparation courses",
    color: "#7C2D12",
    classes: [
      { id: "o-level", name: "O Level", description: "O Level preparation courses", subjects: ["Mathematics", "English", "Science", "Social Studies"] }
    ]
  },
  "a-levels": {
    name: "A Levels",
    icon: "🎓",
    description: "A Level preparation courses",
    color: "#1E40AF",
    classes: [
      { id: "a-level", name: "A Level", description: "A Level preparation courses", subjects: ["Advanced Mathematics", "Physics", "Chemistry", "Biology"] }
    ]
  }
} as const;

type CategoryId = keyof typeof categoryData;
type CategoryInfo = (typeof categoryData)[CategoryId];

const ClassSelectionScreen = () => {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const resolvedCategoryId = typeof categoryId === 'string' ? categoryId : null;
  
  const [category, setCategory] = useState<CategoryInfo | null>(null);

  useEffect(() => {
    if (resolvedCategoryId && categoryData[resolvedCategoryId as CategoryId]) {
      setCategory(categoryData[resolvedCategoryId as CategoryId]);
    }
  }, [resolvedCategoryId]);

  if (!category || !resolvedCategoryId) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleClassPress = (classItem: CategoryInfo['classes'][number]) => {
    router.push({
      pathname: '/filtered-courses/[categoryId]/[classId]',
      params: { categoryId: resolvedCategoryId, classId: classItem.id }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: category.color }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{category.icon}</Text>
          <Text style={styles.headerTitle}>{category.name}</Text>
          <Text style={styles.headerDescription}>{category.description}</Text>
        </View>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/courses')}>
          <Text style={styles.breadcrumbText}>Courses</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}> › </Text>
        <Text style={[styles.breadcrumbText, { color: category.color }]}>{category.name}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Select Your Class</Text>
        
        <View style={styles.classesGrid}>
          {category.classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[styles.classCard, { borderColor: category.color + '30' }]}
              onPress={() => handleClassPress(classItem)}
            >
              <View style={[styles.classIcon, { backgroundColor: category.color + '20' }]}>
                <Text style={styles.classNumber}>{classItem.id}</Text>
              </View>
              
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classDescription}>{classItem.description}</Text>
              
              <View style={styles.subjectsContainer}>
                {classItem.subjects.slice(0, 3).map((subject, index) => (
                  <View key={index} style={[styles.subjectTag, { backgroundColor: category.color + '20' }]}>
                    <Text style={[styles.subjectText, { color: category.color }]}>{subject}</Text>
                  </View>
                ))}
                {classItem.subjects.length > 3 && (
                  <View style={[styles.subjectTag, { backgroundColor: category.color + '20' }]}>
                    <Text style={[styles.subjectText, { color: category.color }]}>+{classItem.subjects.length - 3}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={category.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: category.color + '10' }]}>
          <Text style={[styles.infoTitle, { color: category.color }]}>
            📚 What You'll Learn
          </Text>
          <Text style={styles.infoText}>
            Each class level builds upon the previous one, ensuring a solid foundation for your academic journey. 
            Choose the class that matches your current level and start learning!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#6B7280',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  classesGrid: {
    gap: 16,
    marginBottom: 30,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  classIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  classNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  classDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subjectTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  arrowContainer: {
    alignItems: 'flex-end',
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default ClassSelectionScreen; 