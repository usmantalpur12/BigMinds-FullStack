import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism } from '../theme/colors';

const { width, height } = Dimensions.get('window');

// Categories data
type CategoryId = 'pre-engineering' | 'pre-medical' | 'computer-science' | 'bba' | 'o-levels' | 'a-levels';

interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
  classOptions: string[];
  color: string;
  gradient: [string, string];
}

const categories: Category[] = [
  {
    id: 'pre-engineering',
    name: 'Pre-Engineering',
    icon: '🔧',
    description: 'Engineering preparation courses for FSc students',
    classOptions: ['9', '10', '11', '12'],
    color: '#4F46E5',
    gradient: ['#4F46E5', '#7C3AED']
  },
  {
    id: 'pre-medical',
    name: 'Pre-Medical',
    icon: '🏥',
    description: 'Medical preparation courses for FSc students',
    classOptions: ['9', '10', '11', '12'],
    color: '#DC2626',
    gradient: ['#DC2626', '#EA580C']
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: '💻',
    description: 'Computer science and programming courses',
    classOptions: ['9', '10', '11', '12'],
    color: '#059669',
    gradient: ['#059669', '#0D9488']
  },
  {
    id: 'bba',
    name: 'BBA',
    icon: '💼',
    description: 'Business administration and management courses',
    classOptions: ['9', '10', '11', '12'],
    color: '#D97706',
    gradient: ['#D97706', '#F59E0B']
  },
  {
    id: 'o-levels',
    name: 'O Levels',
    icon: '📚',
    description: 'O Level preparation courses',
    classOptions: ['o-level'],
    color: '#7C2D12',
    gradient: ['#7C2D12', '#92400E']
  },
  {
    id: 'a-levels',
    name: 'A Levels',
    icon: '🎓',
    description: 'A Level preparation courses',
    classOptions: ['a-level'],
    color: '#1E40AF',
    gradient: ['#1E40AF', '#1D4ED8']
  }
] as const;

const CoursesScreen = () => {
  const router = useRouter();
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  // Responsive values
  const isSmallDevice = width < 375;
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    // Animate header
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    // Animate content with delay
    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 800 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category);
    setShowClassSelection(true);
  };

  const handleClassPress = (classOption: string) => {
    if (!selectedCategory) return;
    router.push({
      pathname: '/filtered-courses/[categoryId]/[classId]',
      params: { 
        categoryId: selectedCategory.id,
        classId: classOption 
      }
    });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowClassSelection(false);
  };

  const handleChangeCategory = () => {
    setSelectedCategory(null);
    setShowClassSelection(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View style={[
        {
          backgroundColor: colors.background,
          paddingTop: 50,
          paddingHorizontal: responsivePadding,
          paddingBottom: responsivePadding,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerAnimatedStyle
      ]}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: responsivePadding,
        }}>
          <Text style={{ 
            fontSize: responsive.getFontSize(28, width),
            fontWeight: 'bold', 
            color: colors.textPrimary,
          }}>
            {showClassSelection && selectedCategory ? selectedCategory.name : 'Courses'}
          </Text>
          
          <TouchableOpacity
            style={{ 
              width: isSmallDevice ? 40 : 48, 
              height: isSmallDevice ? 40 : 48, 
              ...glassmorphism.light,
              borderRadius: borderRadius.full,
              alignItems: 'center', 
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: isSmallDevice ? 18 : 20 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {showClassSelection ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity 
              onPress={handleBackToCategories}
              style={{ 
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                backgroundColor: colors.surface,
                borderRadius: borderRadius.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14 }}>← Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleChangeCategory}
              style={{ 
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                backgroundColor: colors.primary + '20',
                borderRadius: borderRadius.sm,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14 }}>Change Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ 
            fontSize: responsive.getFontSize(16, width),
            color: colors.textSecondary,
            lineHeight: 22,
          }}>
            Choose your academic track and class to explore available courses
          </Text>
        )}
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: responsivePadding }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimatedStyle}>
          {!showClassSelection ? (
            // Categories Grid - 2 cards per row
            <View style={{ marginBottom: responsive.getSpacing(spacing.xxl, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(20, width),
                fontWeight: '600', 
                color: colors.textPrimary,
                marginBottom: responsivePadding,
              }}>
                Academic Tracks
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between',
                gap: responsive.getSpacing(spacing.md, width),
              }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryPress(category)}
                    style={{ 
                      width: isSmallDevice ? '100%' : '48%',
                      ...glassmorphism.medium,
                      padding: responsivePadding,
                      borderWidth: 2,
                      borderColor: category.color + '30',
                      alignItems: 'center',
                      marginBottom: spacing.md,
                    }}
                  >
                    <View style={{ 
                      width: 60, 
                      height: 60, 
                      backgroundColor: category.color + '20', 
                      borderRadius: 30,
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: spacing.md,
                    }}>
                      <Text style={{ fontSize: 32 }}>{category.icon}</Text>
                    </View>
                    
                    <Text style={{ 
                      fontSize: responsive.getFontSize(16, width),
                      fontWeight: '600', 
                      color: colors.textPrimary,
                      textAlign: 'center',
                      marginBottom: spacing.xs,
                    }}>
                      {category.name}
                    </Text>
                    
                    <Text style={{ 
                      fontSize: responsive.getFontSize(12, width),
                      color: colors.textSecondary,
                      textAlign: 'center',
                      lineHeight: 16,
                    }}>
                      {category.description}
                    </Text>
                    
                    <View style={{ 
                      marginTop: spacing.sm,
                      backgroundColor: category.color + '20',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.sm,
                    }}>
                      <Text style={{ 
                        fontSize: responsive.getFontSize(10, width),
                        color: category.color,
                        fontWeight: '600',
                      }}>
                        {category.classOptions.length === 1 ? 'Single Level' : `${category.classOptions.length} Classes`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            // Class Selection - 2 cards per row
            <View style={{ marginBottom: responsive.getSpacing(spacing.xxl, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(20, width),
                fontWeight: '600', 
                color: colors.textPrimary,
                marginBottom: responsivePadding,
              }}>
                Select Your Class
              </Text>
              
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.textSecondary,
                marginBottom: responsivePadding,
                lineHeight: 20,
              }}>
                Choose your class level to see available courses in {selectedCategory ? selectedCategory.name : ''}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between',
                gap: responsive.getSpacing(spacing.md, width),
              }}>
                {selectedCategory?.classOptions.map((classOption: string) => {
                  if (!selectedCategory) return null;
                  return (
                  <TouchableOpacity
                    key={classOption}
                    onPress={() => handleClassPress(classOption)}
                    style={{ 
                      width: isSmallDevice ? '100%' : '48%',
                      ...glassmorphism.medium,
                      padding: responsivePadding,
                      borderWidth: 2,
                      borderColor: selectedCategory.color + '30',
                      alignItems: 'center',
                      marginBottom: spacing.md,
                    }}
                  >
                    <View style={{ 
                      width: 60, 
                      height: 60, 
                      backgroundColor: selectedCategory.color + '20', 
                      borderRadius: 30,
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: spacing.md,
                    }}>
                      <Text style={{ 
                        fontSize: 32, 
                        color: selectedCategory.color,
                        fontWeight: 'bold'
                      }}>
                        {classOption === 'o-level' ? 'O' : classOption === 'a-level' ? 'A' : classOption}
                      </Text>
                    </View>
                    
                    <Text style={{ 
                      fontSize: responsive.getFontSize(16, width),
                      fontWeight: '600', 
                      color: colors.textPrimary,
                      textAlign: 'center',
                      marginBottom: spacing.xs,
                    }}>
                      {classOption === 'o-level' ? 'O Level' : 
                       classOption === 'a-level' ? 'A Level' : 
                       `Class ${classOption}`}
                    </Text>
                    
                    <Text style={{ 
                      fontSize: responsive.getFontSize(12, width),
                      color: colors.textSecondary,
                      textAlign: 'center',
                      lineHeight: 16,
                    }}>
                      {classOption === 'o-level' ? 'O Level preparation courses' :
                       classOption === 'a-level' ? 'A Level preparation courses' :
                       `${selectedCategory.name} courses for Class ${classOption}`}
                    </Text>
                    
                    <View style={{ 
                      marginTop: spacing.sm,
                      backgroundColor: selectedCategory.color + '20',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.sm,
                    }}>
                      <Text style={{ 
                        fontSize: responsive.getFontSize(10, width),
                        color: selectedCategory.color,
                        fontWeight: '600',
                      }}>
                        View Courses
                      </Text>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quick Start Guide - Only show when no category selected */}
          {!showClassSelection && (
            <View style={{ 
              ...glassmorphism.light,
              backgroundColor: colors.primary + '15',
              padding: responsivePadding,
              borderWidth: 1.5,
              borderColor: colors.primary + '40',
            }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(18, width),
                fontWeight: '600', 
                color: colors.primary,
                marginBottom: spacing.sm,
              }}>
                🚀 How to Get Started
              </Text>
              
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: colors.primary, 
                    borderRadius: 12,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>1</Text>
                  </View>
                  <Text style={{ 
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.textSecondary,
                    flex: 1,
                  }}>
                    Select your academic track (Pre-Engineering, Pre-Medical, etc.)
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: colors.primary, 
                    borderRadius: 12,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>2</Text>
                  </View>
                  <Text style={{ 
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.textSecondary,
                    flex: 1,
                  }}>
                    Choose your class level (9, 10, 11, 12, O Level, A Level)
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: colors.primary, 
                    borderRadius: 12,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>3</Text>
                  </View>
                  <Text style={{ 
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.textSecondary,
                    flex: 1,
                  }}>
                    Browse and enroll in courses that match your needs
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default CoursesScreen;