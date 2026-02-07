import Divider from '@mui/material/Divider';

export default function DashboardSidebarDividerItem() {
  return (
    <li>
      <Divider
        sx={{
          borderBottomWidth: 1,
          my: 1,
          mx: -0.5,
        }}
      />
    </li>
  );
}
