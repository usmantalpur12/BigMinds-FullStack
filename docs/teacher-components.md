## Teacher-Only Reusable Components Inventory

Currently, no standalone reusable components exist that are scoped exclusively to the teacher experience. Every teacher screen composes global UI primitives such as `ModernInput`, `ModernButton`, `ModernCard`, and `GlassCard`, all of which are shared with the student flow.

### Implications

- Introduce a dedicated `TeacherUI` component set (inputs, selects, cards, skeletons) before refactoring screens to avoid duplicating logic.
- Co-locate new teacher-only primitives under `BigMindsEducation/app/teacher/components/` so they remain isolated from the student theme until the redesign ships.
- Document any new component in this file to keep the inventory in sync.

