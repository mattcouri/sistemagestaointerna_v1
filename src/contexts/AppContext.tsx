// In your AppContext.tsx, replace these functions:

const createProject = async (name: string, description: string, assignedUserIds: string[], color?: string) => {
  if (!currentUser) throw new Error('Not authenticated');

  try {
    const projectColor = color || PRESET_COLORS[projects.length % PRESET_COLORS.length];
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        color: projectColor,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add project members (including creator)
    const allMemberIds = [currentUser.id, ...assignedUserIds];
    const uniqueMemberIds = [...new Set(allMemberIds)]; // Remove duplicates
    
    if (uniqueMemberIds.length > 0) {
      const { error: membersError } = await supabase
        .from('project_members')
        .insert(
          uniqueMemberIds.map(userId => ({
            project_id: project.id,
            user_id: userId,
          }))
        );

      if (membersError) throw membersError;
    }

    // DO NOT create individual lists here
    // The project lists will be created separately in the project view
    // Personal dashboard will show consolidated view of user's assigned tasks

    await refreshData();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

const loadLists = async () => {
  if (!currentUser) return;

  try {
    // Get personal lists
    const { data: personalLists, error: personalError } = await supabase
      .from('lists')
      .select(`
        *,
        tasks (*)
      `)
      .eq('user_id', currentUser.id)
      .eq('type', 'personal')
      .order('position', { ascending: true });

    if (personalError) throw personalError;

    // Get project lists where user is a member
    const { data: projectMemberships, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', currentUser.id);

    let consolidatedProjectLists: any[] = [];

    if (!memberError && projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map(m => m.project_id);
      
      // Get all projects user is member of
      const { data: userProjects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);

      if (!projectError && userProjects) {
        // For each project, create a consolidated list view
        for (const project of userProjects) {
          // Get all lists in this project
          const { data: projectLists, error: listsError } = await supabase
            .from('lists')
            .select(`
              *,
              tasks (*)
            `)
            .eq('project_id', project.id);

          if (!listsError && projectLists) {
            // Get all tasks from all lists in this project that are assigned to current user
            const userAssignedTasks = projectLists
              .flatMap(list => list.tasks || [])
              .filter(task => task.assigned_to === currentUser.id);

            // Create consolidated project view for personal dashboard
            const consolidatedList = {
              id: `project-${project.id}`, // Virtual ID for consolidated view
              title: project.name,
              strategy: `Consolidated view of ${project.name} tasks assigned to you`,
              type: 'project',
              project_id: project.id,
              user_id: currentUser.id,
              color: project.color,
              position: personalLists.length + consolidatedProjectLists.length,
              created_at: project.created_at,
              updated_at: project.updated_at,
              tasks: userAssignedTasks
            };

            consolidatedProjectLists.push(consolidatedList);
          }
        }
      }
    }

    // Combine personal lists and consolidated project views
    setLists([...(personalLists || []), ...consolidatedProjectLists]);
  } catch (error) {
    console.error('Error loading lists:', error);
  }
};

// Add new function to get actual project lists (for project view)
const getProjectLists = (projectId: string) => {
  // This should fetch actual lists within a project (for project management view)
  // Different from the consolidated view in personal dashboard
  return lists.filter(list => list.project_id === projectId && !list.id.startsWith('project-'));
};

// Update addTaskToList to handle both real and virtual lists
const addTaskToList = async (listId: string, taskData: any) => {
  try {
    let targetListId = listId;
    
    // If adding to a consolidated project view, we need to create/find an actual list
    if (listId.startsWith('project-')) {
      const projectId = listId.replace('project-', '');
      
      // Find or create a default list for this project
      const { data: projectLists, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', currentUser.id);

      if (listsError) throw listsError;

      if (projectLists && projectLists.length > 0) {
        // Use existing list
        targetListId = projectLists[0].id;
      } else {
        // Create a new list for this user in the project
        const project = projects.find(p => p.id === projectId);
        const { data: newList, error: createError } = await supabase
          .from('lists')
          .insert({
            title: `${project?.name || 'Project'} - ${currentUser.name}`,
            strategy: '',
            type: 'project',
            project_id: projectId,
            user_id: currentUser.id,
            color: project?.color,
            position: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        targetListId = newList.id;
      }
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        tag: generateUniqueTag(),
        list_id: targetListId,
      });

    if (error) throw error;
    await loadLists();
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};