package com.example.game.config;

import com.example.game.service.SinglePlayerGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private SinglePlayerGameService singlePlayerGameService;
    
    @Override
    public void run(String... args) throws Exception {
        // 初始化默认游戏任务
        singlePlayerGameService.initializeDefaultTasks();
        System.out.println("游戏任务数据初始化完成");
    }
}
