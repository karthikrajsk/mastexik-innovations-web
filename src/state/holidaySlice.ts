import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import holidayService, { Holiday } from "@/services/holidayService";
import { toast } from "react-toastify";

interface HolidayState {
  holidayList: Holiday[];
  loading: boolean;
  error: string | null;
}

const initialState: HolidayState = {
  holidayList: [],
  loading: false,
  error: null,
};

export const fetchHolidays = createAsyncThunk("holiday/fetchHolidays", async () => {
  return await holidayService.getAllHolidays();
});

export const addHoliday = createAsyncThunk("holiday/addHoliday", async (holiday: Holiday) => {
  const result = await holidayService.createHoliday(holiday);
  toast.success("Holiday created successfully");
  return result;
});

export const updateHoliday = createAsyncThunk(
  "holiday/updateHoliday",
  async ({ id, holiday }: { id: number; holiday: Holiday }) => {
    const result = await holidayService.updateHoliday(id, holiday);
    toast.success("Holiday updated successfully");
    return result;
  }
);

export const removeHoliday = createAsyncThunk("holiday/removeHoliday", async (id: number) => {
  await holidayService.deleteHoliday(id);
  toast.success("Holiday deleted successfully");
  return id;
});

const holidaySlice = createSlice({
  name: "holiday",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchHolidays
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidayList = action.payload;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch holidays";
      })
      // addHoliday
      .addCase(addHoliday.fulfilled, (state, action) => {
        state.holidayList.push(action.payload);
      })
      // updateHoliday
      .addCase(updateHoliday.fulfilled, (state, action) => {
        const index = state.holidayList.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.holidayList[index] = action.payload;
        }
      })
      // removeHoliday
      .addCase(removeHoliday.fulfilled, (state, action) => {
        state.holidayList = state.holidayList.filter((h) => h.id !== action.payload);
      });
  },
});

export default holidaySlice.reducer;
