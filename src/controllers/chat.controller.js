const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const { USER_ROLES } = require("../utils/constants");

// Định nghĩa các công cụ (Tools) theo định dạng OpenAI / Groq
const groqTools = [
  {
    type: "function",
    function: {
      name: "getDriversList",
      description: "Lấy danh sách tất cả tài xế trong hệ thống kèm trạng thái hoạt động và thông tin xe họ đang lái.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getVehiclesList",
      description: "Lấy danh sách tất cả xe trong hệ thống, bao gồm biển số, hãng xe, số chỗ ngồi, trạng thái (active, maintenance, rented, inactive) và tài xế hiện tại.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getRecentTrips",
      description: "Lấy danh sách 10 chuyến đi (trips) gần đây nhất, bao gồm trạng thái (new, assigned, called, picked_up, completed, cancelled), giá tiền, điểm đón, điểm trả, tài xế và biển số xe.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

// Hàm thực thi các Tools trong Database
async function executeTool(name, args) {
  console.log(`🔧 Executing Tool: ${name}`, args);
  try {
    switch (name) {
      case "getDriversList": {
        const drivers = await User.find({ role: USER_ROLES.DRIVER }).select("-password").lean();
        const driversWithVehicles = await Promise.all(
          drivers.map(async (driver) => {
            const vehicle = await Vehicle.findOne({ currentDriver: driver._id }).select("licensePlate brand model");
            return {
              id: driver._id,
              fullName: driver.fullName,
              phone: driver.phone,
              email: driver.email,
              isActive: driver.isActive,
              currentVehicle: vehicle ? {
                licensePlate: vehicle.licensePlate,
                brand: vehicle.brand,
                model: vehicle.model
              } : null
            };
          })
        );
        return { drivers: driversWithVehicles };
      }

      case "getVehiclesList": {
        const vehicles = await Vehicle.find().populate("currentDriver", "fullName phone").lean();
        const formattedVehicles = vehicles.map(v => ({
          id: v._id,
          licensePlate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          seats: v.seats,
          status: v.status,
          currentDriver: v.currentDriver ? {
            fullName: v.currentDriver.fullName,
            phone: v.currentDriver.phone
          } : null
        }));
        return { vehicles: formattedVehicles };
      }

      case "getRecentTrips": {
        const trips = await Trip.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("driver", "fullName phone")
          .populate("vehicle", "licensePlate")
          .lean();
        
        const formattedTrips = trips.map(t => ({
          id: t._id,
          customerPhone: t.customerPhone,
          pickupLocation: t.pickupLocation?.address || t.pickupLocation || "",
          dropoffLocation: t.dropoffLocation?.address || t.dropoffLocation || "",
          status: t.status,
          scheduledTime: t.scheduledTime,
          estimatedPrice: t.estimatedPrice,
          actualPrice: t.actualPrice,
          driver: t.driver ? {
            fullName: t.driver.fullName,
            phone: t.driver.phone
          } : null,
          vehicle: t.vehicle ? {
            licensePlate: t.vehicle.licensePlate
          } : null
        }));
        return { trips: formattedTrips };
      }

      default:
        return { error: `Không tìm thấy công cụ: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return { error: `Lỗi truy vấn cơ sở dữ liệu: ${error.message}` };
  }
}

// Xử lý gửi tin nhắn chat
exports.handleChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Nội dung tin nhắn không được để trống"
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: "⚠️ Chào bạn, hệ thống chưa phát hiện cấu hình GROQ_API_KEY trong file .env. Vui lòng thêm key (dạng gsk_...) để chat với AI thật, hoặc tiếp tục thử nghiệm ở chế độ giả lập này!"
      });
    }

    // Thiết lập System Instruction dựa trên phân quyền người dùng
    let systemInstructionText = `Bạn là trợ lý ảo AI của hệ thống điều hành taxi "Smart Fleet AI". Bạn hãy trả lời bằng Tiếng Việt thân thiện, lịch sự và chuyên nghiệp.
Người dùng hiện tại tên là: ${user.fullName}, có vai trò là: ${user.role}.
`;

    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.DISPATCHER) {
      systemInstructionText += `Bạn có quyền xem thông tin chi tiết xe, tài xế và danh sách chuyến đi. Bạn có nhiệm vụ hỗ trợ họ điều phối xe nhanh hơn. Nếu họ muốn biết về xe hay tài xế, hãy sử dụng các công cụ được cung cấp để lấy thông tin mới nhất từ cơ sở dữ liệu và trả lời thật chi tiết (có thể định dạng bảng markdown để dễ nhìn).`;
    } else if (user.role === USER_ROLES.DRIVER) {
      systemInstructionText += `Bạn đang hỗ trợ một Tài xế. Hãy trả lời ngắn gọn, tập trung vào lịch làm việc, an toàn giao thông và quy trình nhận xe. Bạn không có quyền truy cập thông tin của các tài xế khác hoặc các báo cáo doanh thu cấp cao.`;
    } else if (user.role === USER_ROLES.ACCOUNTANT) {
      systemInstructionText += `Bạn đang hỗ trợ một Kế toán viên. Hãy trả lời tập trung vào các câu hỏi về chi phí, doanh thu, xác nhận nộp tiền của tài xế.`;
    }

    // Chuẩn bị danh sách tin nhắn cho OpenAI / Groq
    const messages = [
      {
        role: "system",
        content: systemInstructionText
      }
    ];

    // Thêm lịch sử chat từ FE
    if (Array.isArray(history)) {
      history.forEach((msg) => {
        messages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        });
      });
    }

    // Thêm tin nhắn hiện tại của user
    messages.push({
      role: "user",
      content: message
    });

    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";

    let keepRunning = true;
    let loopCount = 0;
    let finalReply = "";

    while (keepRunning && loopCount < 3) {
      loopCount++;
      const payload = {
        model: "llama-3.3-70b-versatile",
        messages,
        tools: groqTools,
        tool_choice: "auto"
      };

      const response = await fetch(groqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error details:", errorText);
        
        if (response.status === 429) {
          throw new Error("Tài khoản Groq API của bạn đã tạm thời vượt quá giới hạn cuộc gọi (Quota Exceeded). Vui lòng thử lại sau 1 phút.");
        }
        throw new Error(`Lỗi kết nối Groq API: ${response.statusText} (${response.status})`);
      }

      const responseData = await response.json();
      const choice = responseData.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        throw new Error("Không nhận được phản hồi hợp lệ từ Groq API");
      }

      // Đẩy tin nhắn của Assistant vào history
      messages.push(assistantMessage);

      // Kiểm tra xem Groq có yêu cầu gọi Tool/Function nào không
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let functionArgs = {};
          
          try {
            functionArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch (e) {
            console.error("Lỗi parse arguments của tool:", e);
          }

          // Thực thi hàm lấy kết quả
          const toolResult = await executeTool(functionName, functionArgs);

          // Đẩy kết quả trả về của Tool vào message history
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(toolResult)
          });
        }
        // Tiếp tục vòng lặp để gửi kết quả tool lại cho Groq trả ra câu trả lời cuối cùng
      } else {
        // Không gọi thêm hàm nào nữa, đây là câu trả lời text cuối cùng
        finalReply = assistantMessage.content || "";
        keepRunning = false;
      }
    }

    res.json({
      success: true,
      reply: finalReply
    });

  } catch (error) {
    console.error("Chatbot Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Có lỗi xảy ra khi xử lý tin nhắn của bạn",
      error: error.message
    });
  }
};
